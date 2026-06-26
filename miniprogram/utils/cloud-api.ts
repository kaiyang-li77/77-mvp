export interface CloudApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  code?: number;
}

export async function call<T = any>(
  method: string,
  path: string,
  body?: Record<string, any>
): Promise<T> {
  const res = await wx.cloud.callFunction({
    name: 'api',
    data: { method, path, body }
  });

  const result = res.result as CloudApiResponse<T>;
  if (!result.success) {
    throw new Error(result.message || '请求失败');
  }
  return result.data;
}
