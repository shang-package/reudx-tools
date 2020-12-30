import { camelCase } from 'change-case';
import { InjectParams, InjectReturn } from '../types';

export default ({ comment, stateName }: InjectParams): InjectReturn => {
  return {
    reg: /([\n\r]\s*reducers\s*:\s*{)([\r\n}])/,
    replace: (_: string, $1: string, $2: string) => {
      return `${$1}
${comment}
${camelCase(`set ${stateName}`)}(state, { payload }) {  
    return {        
      ...state,        
      ...payload,      
    };    
  },
${$2}`;
    },
  };
};
