import { camelCase } from 'change-case';
import { format as prettierFormat } from 'prettier';
import { InjectParams } from '../types';

export default ({
  injectKey,
  comment,
  apiPath,
  prettierrc,
  requestMethod,
  input,
}: Pick<
  InjectParams,
  'injectKey' | 'comment' | 'apiPath' | 'prettierrc' | 'requestMethod'
> & { input: string }): string => {
  const serverName = camelCase(`${injectKey} server`);
  const dataName =
    requestMethod.toLocaleLowerCase() === 'get' ? 'params' : 'data';

  const result = `${input}
${comment}
export async function ${serverName}(${dataName}) {
return request(\`${apiPath}\`, {
  method: "${requestMethod}",
  ${dataName}
});
}
`;

  const output = prettierFormat(result, prettierrc);

  return output;
};
