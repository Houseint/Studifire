import { useState, useEffect } from 'react';
import { getSessionUser } from './authDb';

export function useUserId() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let mounted = true;

    getSessionUser()
      .then((user) => {
        if (mounted && user?.id) setUserId(user.id);
      })
      .catch(() => {
        if (mounted) setUserId(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return userId;
}
