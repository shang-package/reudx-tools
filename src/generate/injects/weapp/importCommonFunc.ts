import { InjectReturn } from '../types';

export default (): InjectReturn => {
  return {
    reg: new RegExp(
      "(from './commonFunc')?([\\d\\D]{0, 19})([\\r\\n\\s]*export default)"
    ),
    replace: (all: string, $1: string, $2: string, $3: string) => {
      if ($1) {
        return all;
      }

      return `
  ${$2}
  import { dealPayloadParams } from './commonFunc';
  ${$3}
  `;
    },
  };
};
