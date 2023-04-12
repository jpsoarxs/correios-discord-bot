export interface ICorreios {
  codObjeto: string;
  eventos: IEventos[];
  modalidade: string;
  tipoPostal: [Object];
  habilitaAutoDeclaracao: boolean;
  permiteEncargoImportacao: boolean;
  habilitaPercorridaCarteiro: boolean;
  bloqueioObjeto: boolean;
  possuiLocker: boolean;
  habilitaLocker: boolean;
  habilitaCrowdshipping: boolean;
}

export interface IEventos {
  codigo: string;
  descricao: string;
  dtHrCriado: string;
  tipo: string;
  unidade: { endereco: IEndereco[]; tipo: string };
  unidadeDestino?: { endereco: IEndereco[]; tipo: string };
  urlIcone: string;
}

export interface IEndereco {
  cidade: string;
  uf: string;
}
