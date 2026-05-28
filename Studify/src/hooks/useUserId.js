import { useState, useEffect } from 'react';
import { getSessionUser } from '../services/authDb';

export function useUserId() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    getSessionUser().then(user => {
      if (user?.id) setUserId(user.id);
    });
  }, []);

  return userId;
}
