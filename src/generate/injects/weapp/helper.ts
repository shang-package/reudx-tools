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
    params: camelCase(`${k} ListParams`),
    pagination: camelCase(`${k} ListPagination`),
    finished: camelCase(`${k} ListFinished`),
  };
}

export { getNames };
