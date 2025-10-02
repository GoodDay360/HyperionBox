import js from '@eslint/js'
import * as tseslint from '@typescript-eslint/eslint-plugin'
import parser from '@typescript-eslint/parser'
import unusedImports from 'eslint-plugin-unused-imports'
import solid from 'eslint-plugin-solid'

export default [
    js.configs.recommended,
    {
        files: ['src/**/*.{ts,tsx}'],
        languageOptions: {
            parser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            'unused-imports': unusedImports,
            'solid': solid,
        },
        rules: {
            // ✅ Allow console usage with warnings
                'no-console': [
                'warn',
                {
                    allow: ['log', 'warn', 'error', 'info', 'clear', 'trace', 'dir'],
                },
            ],

            // ✅ Disable conflicting core rules
            'no-undef': 'off',
            'no-unused-vars': 'off',
            'no-extra-boolean-cast': 'off',

            // ✅ Use plugin for unused imports and variables
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'error',
                {
                    vars: 'all',
                    args: 'after-used',
                    ignoreRestSiblings: true,
                    varsIgnorePattern: '^_+$', // ✅ allows _, __, ___, etc.
                    argsIgnorePattern: '^_',
                },
            ],

            // ✅ SolidJS best practices
            'solid/reactivity': 'warn',
        },
    },
]