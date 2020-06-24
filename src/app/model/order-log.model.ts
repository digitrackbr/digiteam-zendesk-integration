import {AgentModel} from './agent.model';
import {OrderStatusModel} from './order-status.model';

export interface OrderLogModel {
  id: number;
  createdOn: Date;
  systemCreated: Date;
  orderStatus: OrderStatusModel;
  author: AgentModel;
  logTypeId: number;
}
