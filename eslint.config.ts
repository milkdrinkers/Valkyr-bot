import { includeIgnoreFile } from "@eslint/compat";
import path from "node:path";

import type { FlatConfig } from '@typescript-eslint/utils/ts-eslint';
import tsParser from '@typescript-eslint/parser';
import typeScriptPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import nPlugin from 'eslint-plugin-n';
import prettierConfig from 'eslint-config-prettier';

export default [
    includeIgnoreFile(path.resolve(import.meta.dirname, ".gitignore")),
    {
        ignores: ['*.config.*']
    },
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    experimentalDecorators: true,
                    legacyDecorators: true
                }
            }
        },
        plugins: {
            '@typescript-eslint': typeScriptPlugin,
            import: importPlugin,
            n: nPlugin
        },
        rules: {
            // Core TypeScript rules
            '@typescript-eslint/no-unused-vars': [
                "error",
                {
                    "argsIgnorePattern": "^_",
                    "varsIgnorePattern": "^_",
                    "caughtErrorsIgnorePattern": "^_"
                }
            ],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                { accessibility: 'explicit' }
            ],

            // Decorator-specific rules
            '@typescript-eslint/no-unsafe-declaration-merging': 'warn',

            // Import/export rules
            'import/order': [
                'error',
                {
                    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                    alphabetize: { order: 'asc', caseInsensitive: true }
                }
            ],

            // Node.js/ESM rules
            'n/no-missing-import': 'off',
            'n/no-unsupported-features/es-syntax': [
                'error',
                { ignores: ['modules'] }
            ]
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './tsconfig.json'
                }
            }
        }
    },
    {
        files: ['**/*.decorator.ts'],
        rules: {
            '@typescript-eslint/ban-types': 'off',
            '@typescript-eslint/no-explicit-any': 'off'
        }
    },
    // Prettier config must come last
    prettierConfig
] satisfies FlatConfig.ConfigArray;