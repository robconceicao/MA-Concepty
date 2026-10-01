# MA-01/02/03 — lembretes, calendário e demonstração
- Abrir WhatsApp registra somente tentativa local. Marcar aviso exige confirmação manual explícita; cancelamento/falha de gravação não marca cliente.
- Derivados de prazo são recalculados ao mudar o dia local e ao foreground; relógio injetável nos cálculos para testes.
- Demonstração só existe quando sem Supabase, appEnvironment=homologation e EXPO_PUBLIC_DEMO_MODE=true. Banner permanente informa dados temporários perdidos ao reiniciar; produção sem configuração bloqueia a tela.
- Sem mensagens externas automatizadas, APK, publicação, ativação comercial ou alteração remota.
Aceite: cancelamento mantém aviso; confirmar grava antes de marcar; erro mantém tentativa pendente; meia-noite altera prazo e aviso do dia anterior; produção sem chaves não vira demo.
