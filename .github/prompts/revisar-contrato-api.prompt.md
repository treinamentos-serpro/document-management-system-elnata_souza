---
description: "Revisa a compatibilidade de uma rota entre a especificação, o backend Express e o cliente frontend."
name: "revisar-contrato-api"
argument-hint: "rota ou recurso para revisar (ex. /documents/:id/download)"
agent: "agent"
---

# Revisar contrato de API

Revise o contrato da rota ou recurso `${input:rota:rota ou recurso}` sem modificar arquivos.

1. Leia as instruções do repositório e a especificação correspondente em `docs/specs`.
2. Rastreie o fluxo no backend pelas camadas `routes -> controllers -> services -> repositories` e encontre o cliente `fetch` correspondente em `frontend/src/services`.
3. Compare método e caminho HTTP, campos e formatos de entrada, status e formato de sucesso, respostas de erro e comportamento para conteúdo binário/download. Considere o prefixo `/api` e o rewrite do proxy Vite.
4. Consulte os testes existentes para distinguir divergência real de comportamento documentado que ainda não tem cobertura.

Apresente primeiro os problemas encontrados, ordenados por severidade, com caminhos de arquivo e evidência concreta. Depois liste lacunas de teste e pressupostos. Se não encontrar problemas, declare isso claramente e registre os riscos ou cenários ainda sem teste. Não implemente correções nem altere arquivos.