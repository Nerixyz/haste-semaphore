/* eslint-disable no-undef */
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: 'tests/.*\\.test\\.[jt]s$',
  coveragePathIgnorePatterns: ['test'],
};
