# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web para enviar, listar e baixar documentos armazenados localmente, com metadados mantidos em memória e associação a um único proprietário configurado por instalação.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição HTTP.
- Listagem dos documentos conhecidos pela instância em execução.
- Download de um documento pelo identificador.
- Associação dos documentos a um proprietário configurado para a instalação.
- Armazenamento dos arquivos no filesystem local da aplicação com `multer` e `diskStorage`.
- Interface React para upload, listagem e download, integrada à API por meio do proxy `/api` do Vite.

### Fora do escopo

- Armazenamento em nuvem ou uso de provedores externos.
- Persistência de metadados em banco de dados ou recuperação automática dos metadados após reiniciar o processo.
- Autenticação, autorização multiusuário, cadastro de usuários ou isolamento seguro entre usuários.
- Versionamento, busca avançada, compartilhamento, exclusão e retenção automática de documentos.
- Restrição por lista de extensões ou tipos MIME nesta fase.

> **Limitação do MVP:** `DMS_DEFAULT_OWNER` identifica o único proprietário da instalação, mas não autentica quem faz a requisição. Esse valor não deve ser tratado como uma barreira de segurança nem como suporte a múltiplos usuários.

## 3. Requisitos funcionais

| ID | Requisito | Critérios de aceitação |
| --- | --- | --- |
| RF-01 | O usuário pode enviar um documento. | A API recebe um arquivo no campo `file` de uma requisição `multipart/form-data`, rejeita arquivo ausente ou vazio e retorna os metadados do documento criado. |
| RF-02 | O usuário pode listar os documentos enviados. | A API retorna uma lista de metadados pertencentes ao `DMS_DEFAULT_OWNER` configurado. Quando não houver documentos, retorna uma lista vazia com status `200`. |
| RF-03 | O usuário pode baixar um documento pelo identificador. | A API retorna o conteúdo binário do documento quando seu identificador é conhecido e o arquivo está disponível. Documento inexistente ou não associado ao proprietário configurado resulta em `404`. |
| RF-04 | O sistema associa os documentos ao proprietário da instalação. | O valor não vazio de `DMS_DEFAULT_OWNER` é associado aos metadados de cada upload e usado na listagem e no download. Não existe seleção de proprietário pelo cliente. |
| RF-05 | O sistema informa falhas de requisição e armazenamento de forma previsível. | Erros da API usam status HTTP apropriado e um corpo JSON padronizado, sem expor caminhos locais, stack traces ou detalhes internos do filesystem. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos enviados devem ser gravados somente no filesystem local, usando `multer` com `diskStorage` e o diretório configurado em `DMS_STORAGE_DIR`. Armazenamento externo não é permitido. |
| RNF-02 | Os metadados devem ser mantidos em memória durante a execução do processo. Ao reiniciar o backend, os metadados são perdidos; os arquivos no disco permanecem e podem se tornar órfãos. Não haverá reconstrução ou limpeza automática nesta fase. |
| RNF-03 | Configurações operacionais devem ser fornecidas por variáveis de ambiente, seguindo o princípio de configuração externa do 12-Factor App. |
| RNF-04 | O tamanho máximo por arquivo deve ser configurável, com padrão de 10 MiB (`10485760` bytes). Arquivos vazios devem ser rejeitados. Não há allowlist de MIME types ou extensões; o MIME informado pelo cliente é apenas metadado e não comprova o conteúdo do arquivo. |
| RNF-05 | O nome físico do arquivo deve ser gerado pela aplicação. O nome original deve ser preservado apenas como metadado e nunca usado como caminho de destino. Uploads com nomes originais duplicados são permitidos. |
| RNF-06 | A API deve validar entradas nos limites HTTP, não permitir que nomes ou identificadores fornecidos pelo cliente escolham caminhos no filesystem e não deve expor detalhes internos em mensagens de erro. |
| RNF-07 | O backend deve usar JavaScript com CommonJS e Express; o frontend deve usar React com Vite e consumir a API via `fetch` no prefixo `/api`. |

### Configuração por ambiente

| Variável | Obrigatória | Padrão | Descrição |
| --- | --- | --- | --- |
| `PORT` | Não | `3000` | Porta HTTP do backend. |
| `DMS_STORAGE_DIR` | Não | `backend/storage` relativo à raiz da aplicação | Diretório local de armazenamento. Um caminho relativo deve ser resolvido a partir da raiz da aplicação, não do diretório de trabalho arbitrário do processo. |
| `DMS_MAX_FILE_SIZE_BYTES` | Não | `10485760` | Tamanho máximo permitido por arquivo, em bytes; deve ser um inteiro positivo. |
| `DMS_DEFAULT_OWNER` | Sim | Sem padrão | Identificador não vazio do proprietário único associado aos documentos desta instalação. |

## 5. Modelo de dados (metadados do documento)

### Metadados expostos pela API

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único do documento, gerado pela aplicação. |
| `originalName` | string | Nome original recebido do cliente, usado para exibição e como sugestão no download, nunca como caminho físico. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data e hora de recebimento do upload em formato ISO 8601, normalizada para UTC. |
| `owner` | string | Valor de `DMS_DEFAULT_OWNER` vigente no momento do upload. |
| `mimeType` | string ou `null` | Tipo MIME declarado no upload, quando disponível; é informativo e não validado contra o conteúdo. |

### Dados internos de armazenamento

O repositório de arquivos mantém uma chave física (`storageKey`) gerada pela aplicação e usada para localizar o arquivo dentro de `DMS_STORAGE_DIR`. Essa chave ou caminho absoluto é interno: não deve ser incluído nas respostas da API nem derivado diretamente de `id` ou `originalName` sem validação. O repositório de metadados mantém os registros em memória, indexados por `id`.

## 6. Contratos de API

### Convenções

- Os caminhos abaixo são relativos à raiz da API Express.
- No frontend, as chamadas usam `/api` como prefixo. O proxy existente no Vite encaminha para `http://localhost:3000` e remove `/api`; por exemplo, `/api/documents` chega ao backend como `/documents`.
- Respostas de erro JSON seguem o formato `{ "error": { "code": "CODIGO", "message": "Descrição em português" } }`.
- O endpoint operacional `GET /health` permanece disponível e responde `200` com `{ "status": "ok" }`.

### `POST /upload`

Recebe um arquivo para armazenamento local.

- **Entrada:** `multipart/form-data` com exatamente um arquivo no campo `file`.
- **Validação:** arquivo obrigatório, tamanho maior que zero e não superior a `DMS_MAX_FILE_SIZE_BYTES`. Não há restrição por extensão ou MIME type.
- **Sucesso:** `201 Created`, com `Content-Type: application/json` e corpo:

```json
{
  "document": {
    "id": "identificador-gerado",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "uploadedAt": "2026-10-26T12:00:00.000Z",
    "owner": "proprietario-configurado",
    "mimeType": "application/pdf"
  }
}
```

- **Erros:** `400 Bad Request` com `FILE_REQUIRED` quando o arquivo não for enviado, ou `EMPTY_FILE` quando tiver tamanho zero; `413 Payload Too Large` com `FILE_TOO_LARGE` quando exceder o limite; `500 Internal Server Error` com `STORAGE_ERROR` se não for possível gravar o arquivo. Mensagens não devem revelar caminhos locais.
- Se a gravação do arquivo for concluída, mas o registro dos metadados falhar, a aplicação deve tentar remover o arquivo recém-gravado para não deixar um órfão causado por falha parcial da requisição.

### `GET /documents`

Lista os documentos do proprietário configurado para a instalação.

- **Entrada:** sem corpo e sem parâmetros obrigatórios.
- **Sucesso:** `200 OK`, com `Content-Type: application/json` e corpo:

```json
{
  "documents": [
    {
      "id": "identificador-gerado",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "uploadedAt": "2026-10-26T12:00:00.000Z",
      "owner": "proprietario-configurado",
      "mimeType": "application/pdf"
    }
  ]
}
```

- A lista vazia é representada por `{ "documents": [] }`.
- Os registros devem ser retornados do mais recente para o mais antigo. A resposta não inclui `storageKey` nem caminhos do filesystem.
- **Erros:** `500 Internal Server Error` com `INTERNAL_ERROR` em caso de falha inesperada.

### `GET /documents/:id/download`

Baixa o conteúdo de um documento.

- **Entrada:** identificador no segmento `:id`; sem corpo.
- **Sucesso:** `200 OK` com o conteúdo binário, `Content-Type` definido pelo MIME armazenado (ou `application/octet-stream` quando ausente) e `Content-Disposition: attachment` com nome de download seguro derivado do nome original.
- **Erros:** `404 Not Found` com `DOCUMENT_NOT_FOUND` se o identificador não existir, não pertencer ao proprietário configurado ou se o arquivo não estiver disponível no disco. O mesmo erro é usado para não revelar a existência de documentos não acessíveis. `500 Internal Server Error` com `STORAGE_ERROR` para falhas de leitura não classificadas como arquivo ausente.

## 7. Decisões arquiteturais

- O backend segue Clean Architecture simples, com fluxo de dependência `routes -> controllers -> services -> repositories`.
- `routes` definem endpoints e middleware HTTP, incluindo a configuração de upload do `multer`; `controllers` validam e traduzem requisições/respostas HTTP; `services` aplicam regras de upload, associação ao owner e consulta; `repositories` encapsulam acesso ao filesystem local e aos metadados em memória.
- O domínio e os serviços não devem depender de objetos Express. Detalhes de HTTP e `multer` permanecem nas bordas da aplicação.
- O armazenamento dos bytes é local em `backend/storage` por padrão, com `multer` e `diskStorage`. O repositório de metadados é em memória nesta fase.
- O backend usa Express e CommonJS. O frontend usa componentes React e Hooks, organizado em `components/`, `pages/` e `services/`, com chamadas `fetch` pelo prefixo `/api`.
- Não há autenticação. `DMS_DEFAULT_OWNER` representa o único owner da instalação, não uma identidade verificada de usuário. Expor a aplicação a usuários não confiáveis exige autenticação e autorização, fora do escopo deste MVP.
- Como os metadados não são persistidos, após reinicialização os arquivos existentes não aparecem na listagem e não podem ser baixados pela API até que exista uma estratégia de persistência de metadados. A limpeza desses arquivos não faz parte desta fase.

## 8. Plano de execução

As etapas abaixo são uma sequência futura de implementação. Esta especificação não implementa arquivos de backend nem de frontend.

1. Configurar leitura e validação das variáveis de ambiente, diretório de armazenamento local e middleware `multer` com `diskStorage` e limite de tamanho.
2. Implementar o fluxo de upload nas camadas de rota, controller, service e repositories, incluindo metadados em memória, nome físico gerado, owner configurado e compensação de falha parcial.
3. Implementar listagem e download por identificador, com filtro pelo owner configurado, respostas de erro padronizadas e tratamento de arquivo ausente.
4. Adicionar testes backend com `node:test` para upload válido e inválido, limite de tamanho, listagem, download, arquivo inexistente e falhas de armazenamento.
5. Implementar a interface React para upload, exibição da lista e download, consumindo os endpoints pelo prefixo `/api`.
6. Integrar frontend e backend pelo proxy Vite e validar manualmente o fluxo completo, incluindo reinicialização do backend e a limitação de metadados em memória.