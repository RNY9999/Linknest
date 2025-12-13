import type { Config } from 'jest'; // Jest 設定オブジェクトの型
import { pathsToModuleNameMapper } from 'ts-jest'; // tsconfig の paths を Jest 用に変換するヘルパー
import tsconfig from './tsconfig.json'; // tsconfig.json の　import

const config: Config = {
  preset: 'ts-jest', // TS を ts-jest 経由でコンパイルしてからテスト（ js にトランスパイルする必要がない）
  testEnvironment: 'node', // Node.js 環境のテスト
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'], // テスト対象ファイルとして認識するファイル
  moduleFileExtensions: ['ts', 'js', 'json'], // import 解決対象の拡張子
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  // moduleNameMapper: pathsToModuleNameMapper( // tsconfig.json の "paths" を Jest にも教える
  //   tsconfig.compilerOptions.paths || {},
  //   { prefix: '<rootDir>/' }, // tsconfig の "./src/..." を "<rootDir>/src/..."に置換
  // ),
  // TS のパスエイリアスを Jest にも教える（手書き版）
  moduleNameMapper: {
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@errors$': '<rootDir>/src/errors/apiError.ts',
    '^@generated/(.*)$': '<rootDir>/src/generated/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middlewares/$1',
    '^@schemas/(.*)$': '<rootDir>/src/schemas/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@types$': '<rootDir>/src/types/index.ts',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },
}

export default config;