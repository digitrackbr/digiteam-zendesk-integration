export interface CreateOrderRequest {
  orderTypeId?: number;
  regionId?: number;
  priority?: number;
  unitId?: number;
  address?: string;
  street?: string;
  neighborhood?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  requestCode?: string;
  applicantName?: string;
  applicantPhone?: string;
  lat?: number;
  lng?: number;
  description?: string;
}

