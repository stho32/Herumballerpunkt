module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true
  },
  
  extends: [
    'eslint:recommended',
    'plugin:jsdoc/recommended',
    'prettier'
  ],
  
  plugins: [
    'jsdoc'
  ],
  
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  
  globals: {
    // Game-specific globals
    canvas: 'readonly',
    ctx: 'readonly',
    gameManager: 'writable',
    
    // Performance API
    performance: 'readonly',
    
    // Audio API
    AudioContext: 'readonly',
    webkitAudioContext: 'readonly',
    
    // Development globals
    __DEV__: 'readonly',
    __VERSION__: 'readonly'
  },
  
  rules: {
    // Error prevention
    'no-console': 'off', // Allow console for game development
    'no-debugger': 'warn',
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-duplicate-imports': 'error',
    
    // Code quality
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    
    // Spacing and formatting (handled by Prettier, but some ESLint rules)
    'indent': 'off', // Handled by Prettier
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'no-trailing-spaces': 'error',
    'eol-last': 'error',
    
    // Function and class rules
    'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
    'no-empty-function': 'warn',
    'class-methods-use-this': 'off', // Game classes often have methods that don't use 'this'
    
    // Object and array rules
    'dot-notation': 'error',
    'no-useless-computed-key': 'error',
    'prefer-destructuring': ['error', {
      array: false,
      object: true
    }],
    
    // Performance-related rules
    'no-loop-func': 'error',
    'no-inner-declarations': 'error',
    
    // JSDoc rules
    'jsdoc/require-description': 'warn',
    'jsdoc/require-description-complete-sentence': 'warn',
    'jsdoc/require-param-description': 'warn',
    'jsdoc/require-returns-description': 'warn',
    'jsdoc/check-alignment': 'error',
    'jsdoc/check-indentation': 'warn',
    'jsdoc/check-param-names': 'error',
    'jsdoc/check-tag-names': 'error',
    'jsdoc/check-types': 'error',
    'jsdoc/newline-after-description': 'error',
    'jsdoc/no-undefined-types': 'warn',
    'jsdoc/require-jsdoc': ['warn', {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true,
        ArrowFunctionExpression: false,
        FunctionExpression: false
      }
    }],
    'jsdoc/require-param': 'warn',
    'jsdoc/require-param-name': 'error',
    'jsdoc/require-param-type': 'warn',
    'jsdoc/require-returns': 'warn',
    'jsdoc/require-returns-type': 'warn',
    'jsdoc/valid-types': 'error'
  },
  
  overrides: [
    {
      // Configuration files
      files: ['*.config.js', '.eslintrc.js'],
      env: {
        node: true,
        browser: false
      },
      rules: {
        'no-console': 'off'
      }
    },
    
    {
      // Test files
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true,
        vitest: true
      },
      rules: {
        'no-console': 'off',
        'jsdoc/require-jsdoc': 'off'
      }
    },
    
    {
      // Legacy game files (if any remain)
      files: ['js/**/*.js'],
      rules: {
        'no-var': 'off',
        'prefer-const': 'off',
        'jsdoc/require-jsdoc': 'off'
      }
    }
  ],
  
  settings: {
    jsdoc: {
      mode: 'jsdoc',
      tagNamePreference: {
        returns: 'returns'
      }
    }
  }
};
