# admin-ui（Linknest 管理者UI） セットアップ

## 1. Nextプロジェクトの作成

```
npx create-next-app@latest .
```

## 2. セットアップ内容

```
Need to install the following packages:
create-next-app@16.1.1
Ok to proceed? (y) y
√ Would you like to use the recommended Next.js defaults? » No, customize settings
√ Would you like to use TypeScript? ... Yes
√ Which linter would you like to use? » ESLint
√ Would you like to use React Compiler? ... Yes
√ Would you like to use Tailwind CSS? ... No
√ Would you like your code inside a `src/` directory? ... Yes
√ Would you like to use App Router? (recommended) ... Yes
√ Would you like to customize the import alias (`@/*` by default)? ... Yes
√ What import alias would you like configured? ... @/*
```

## 3. package.json の編集

```
"scripts": {
    "dev": "next dev -p 3300",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
```

## 4. 起動確認

```
npm run dev
```