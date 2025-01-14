import axios from "axios";

import { storage } from "@/constants/storage";

const instance = axios.create({
  baseURL: `${process.env.MIDIBUS_API}`,
});

export function getAuthToken() {
  const value = storage.getString("authKey");
  return value;
}

instance.interceptors.request.use((config) => {
  const _authKey = getAuthToken();
  if (_authKey) {
    config.headers["X-Mbus-Token"] = _authKey;
  }

  return config;
});

export { instance };
