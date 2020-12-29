import { InjectParams, InjectReturn } from '../types';

export default ({ serviceName, serverName }: InjectParams): InjectReturn => {
  return {
    reg: new RegExp(
      `({|,)?[\\r\\n\\s]*(}[\\r\\n\\s]*from "@\\/services\\/${serviceName}")`
    ),
    replace: (_: string, $1: string, $2: string) => {
      return `
${$1 ?? ','}
${serverName},
${$2}`;
    },
  };
};
