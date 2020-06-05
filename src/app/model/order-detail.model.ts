import {AddressModel} from './address.model';
import {PlanningModel} from './planning.model';
import {AgentModel} from './agent.model';
import {OrderTypeModel} from './order-type.model';

export interface OrderDetailModel {
  id: number;
  code: string;
  syncConcluded: boolean;
  status: string;
  statusId: number;
  lastmodifieddate: Date;
  priority: number;
  estimatedDuration: number;
  regionName: string;
  createdOn: Date;
  openDate: Date;
  dueDate: Date;
  motive: string;
  reference: string;
  project: string;
  description: string;
  applicantName: string;
  applicantPhoneNumber: string;
  applicantCode: string;
  requestFormDataJson: any;
  notes: string;
  channelId: number;
  sla: number;
  marker: string;
  statusName: string;
  statusColor: string;
  pendingToSynchronize: boolean;
  orderType: OrderTypeModel;
  whereis: AddressModel;
  agentModel: AgentModel;
  planningModel: PlanningModel;
}
