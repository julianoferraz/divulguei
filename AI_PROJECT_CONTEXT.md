**Documento de referência para agentes de IA e desenvolvedores.**
> Consulte este arquivo antes de implementar, corrigir ou atualizar qualquer parte do projeto.

Regra obrigatória: Antes de implementar, atualizar, modificar ou corrigir qualquer parte deste sistema, você deve consultar este arquivo localizado na raiz do projeto e seguir estritamente e à risca todas as instruções, diretrizes e padrões definidos nele. Nenhuma alteração deve ser feita sem antes ter lido e compreendido completamente o conteúdo desse arquivo. Qualquer decisão técnica, estrutural ou de fluxo deve estar em conformidade com o que está documentado aqui e ao final de cada seção, há um lembrete para consultar este guia novamente antes de prosseguir. O não cumprimento desta regra resultará em erros, inconsistências e falhas no sistema, pois este guia é a fonte definitiva de verdade para o projeto. Portanto, antes de qualquer ação, leia este arquivo cuidadosamente e mantenha-o como referência constante durante todo o processo de desenvolvimento e manutenção do sistema. O guia deve ser atualizado sempre que houver mudanças significativas, mas até lá, ele é a única fonte de verdade para todas as decisões relacionadas a este projeto.

🚀 Deploy e Ambiente

- Todo código editado deve ser salvo com Ctrl+S (auto-commit para GitHub automático)
- O deploy na VPS acontece automaticamente após o push (GitHub Actions)
- Aguardar 30 segundos após salvar para o deploy concluir

## ✅ Verificação do deploy

Após salvar e aguardar, verificar se funcionou:
1. Acessar a URL do projeto no navegador e  verificar os logs via terminal:
   ssh root@161.97.171.94 "docker logs NOME_CONTAINER --tail 20"
   ou
   ssh root@161.97.171.94 "pm2 logs NOME_PROJETO --lines 20"

VERSION: 1.0
AI_WORKFLOW_MODE: ENTERPRISE
STRICT_ARCHITECTURE_ENFORCEMENT: TRUE

PROJECT IDENTITY
CURRENT ARCHITECTURE STATE
ARCHITECTURE RULES
CODING STANDARDS
AGENT OPERATION RULES
CHANGE PROTOCOL
SECURITY PRINCIPLES
