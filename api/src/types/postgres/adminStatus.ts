export type AdminStatus = 1 | 2 | 3 | 4 | 5;

export type getAdminStatusServiceResult = {
  data: {
    items: {
      statusId: number;
      label: string;
      isLocked: boolean;
      displayLabel: string;
    }[]
  }
}