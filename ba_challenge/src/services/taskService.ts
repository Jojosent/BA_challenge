import api from './api';
import { Task } from '@/types/index';

export const taskService = {

  create: async (
    challengeId: number,
    title: string,
    description: string
  ): Promise<Task[]> => {
    const response = await api.post('/tasks', { challengeId, title, description });
    return response.data;
  },

  update: async (
    taskId: number,
    title: string,
    description: string
  ): Promise<Task> => {
    const response = await api.put(`/tasks/${taskId}`, { title, description });
    return response.data;
  },

  delete: async (taskId: number): Promise<Task[]> => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  reorder: async (
    taskId: number,
    direction: 'up' | 'down'
  ): Promise<Task[]> => {
    const response = await api.patch(`/tasks/${taskId}/reorder`, { direction });
    return response.data;
  },
};