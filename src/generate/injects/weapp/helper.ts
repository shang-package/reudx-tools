import { camelCase } from 'change-case';

function getNames(
  stateName: string
): {
  list: string;
  params: string;
  pagination: string;
  finished: string;
} {
  const k = stateName.replace(/List$/, '');

  return {
    list: camelCase(`${k} List`),
    params: camelCase(`${k} Params`),
    pagination: camelCase(`${k} Pagination`),
    finished: camelCase(`${k} Finished`),
  };
}

export { getNames };
