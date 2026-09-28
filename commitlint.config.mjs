/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'repo',
        'api',
        'web',
        'shared',
        'contracts',
        'infra',
        'docs',
        'ci',
        'docker',
        'deps',
        'release',
      ],
    ],
    'header-max-length': [2, 'always', 100],
  },
};
