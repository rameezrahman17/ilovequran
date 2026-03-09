import React, { useEffect, useState } from 'react';
import { supabase, api } from '../../api';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial user
        api.getUser().then(u => {
            setUser(u);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                setUser(session.user);
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return { user, loading };
};
