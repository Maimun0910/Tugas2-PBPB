import axios, { AxiosResponse } from 'axios';

export default class EndPointAccess {
  private theUrl: string;

  constructor(url: string) {
    this.theUrl = url;
  }

  async getRes(): Promise<AxiosResponse<any>> {
    return await axios.get(this.theUrl);
  }
}