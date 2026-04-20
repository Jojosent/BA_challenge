import api from './api';
import { FamilyMember, FamilyEvent, Relation } from '@/types/index';

export const familyService = {
  
  getAllFamilyMembers: async (): Promise<{
  ownFamily: { ownerId: number; ownerName: string; isOwn: boolean; members: FamilyMember[] };
  otherFamilies: { ownerId: number; ownerName: string; isOwn: boolean; members: FamilyMember[] }[];
}> => {
  const response = await api.get('/family/all-members');
  return response.data;
},

  getMembers: async (): Promise<FamilyMember[]> => {
    const response = await api.get('/family/members');
    return response.data;
  },

  addMember: async (params: {
    name: string;
    relation: Relation;
    birthYear?: number;
    bio?: string;
    parentId?: number;
  }): Promise<FamilyMember> => {
    const response = await api.post('/family/members', params);
    return response.data;
  },

  updateMember: async (
    memberId: number,
    params: { name: string; relation: Relation; birthYear?: number; bio?: string }
  ): Promise<FamilyMember> => {
    const response = await api.put(`/family/members/${memberId}`, params);
    return response.data;
  },

  deleteMember: async (memberId: number): Promise<void> => {
    await api.delete(`/family/members/${memberId}`);
  },

  getEvents: async (): Promise<FamilyEvent[]> => {
    const response = await api.get('/family/events');
    return response.data;
  },

  addEvent: async (params: {
    title: string;
    description?: string;
    year: number;
    month?: number;
    day?: number;
    emoji?: string;
  }): Promise<FamilyEvent> => {
    const response = await api.post('/family/events', params);
    return response.data;
  },

  deleteEvent: async (eventId: number): Promise<void> => {
    await api.delete(`/family/events/${eventId}`);
  },

  // =======================================================

  searchUsers: async (query: string): Promise<any[]> => {
  const response = await api.get(`/family/search-users?q=${encodeURIComponent(query)}`);
  return response.data;
},

sendInvite: async (params: {
  toUserId: number;
  relation: string;
  parentId?: number;
  birthYear?: number;
}): Promise<any> => {
  const response = await api.post('/family/invite', params);
  return response.data;
},

getMyInvites: async (): Promise<any[]> => {
  const response = await api.get('/family/invites');
  return response.data;
},

respondInvite: async (inviteId: number, accept: boolean): Promise<any> => {
  const response = await api.patch(`/family/invites/${inviteId}`, { accept });
  return response.data;
},

};