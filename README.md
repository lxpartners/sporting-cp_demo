# Sporting CP — App Demo

Conceito de app mobile para gestão de sócios, bilhética digital e marketplace de revenda.

## Estrutura

```
sporting-demo/
├── index.html          ← App (abre este no browser)
├── css/
│   └── style.css       ← Todos os estilos
├── js/
│   ├── data.js         ← Dados de demo (sócios, jogos, bilhetes)
│   ├── app.js          ← Lógica: login, transferências, marketplace
│   ├── render.js       ← Funções que constroem cada ecrã
│   └── logo.js         ← Logo SCP em base64
├── assets/
│   └── logo.png        ← Logo original
├── backend/            ← API Node.js (para deploy com servidor)
├── mobile/             ← App React Native / Expo
├── vercel.json         ← Config de deploy automático
└── .gitignore
```

## Contas de demo

| Email | Password | Escalão |
|---|---|---|
| andre@demo.pt | sporting123 | Gold |
| joao@demo.pt | sporting123 | Silver |
| rui@demo.pt | sporting123 | Platinum |

## Abrir localmente

Duplo clique em `index.html` — **ou**, para evitar problemas com ficheiros locais:

```bash
npx serve .
# Abre http://localhost:3000
```

## Deploy (Vercel)

Ver guia completo em baixo ou em [vercel.com](https://vercel.com).
