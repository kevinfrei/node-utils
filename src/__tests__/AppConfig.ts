import { GetFilePath } from '../AppConfig';

test('AppConfig: GetFilePath', () => {
  expect(GetFilePath('asdf')).toContain('asdf.json');
});
