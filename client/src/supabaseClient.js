
import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your actual Supabase URL and Anon Key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hfkzdvoihzhzneebvlhs.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhma3pkdm9paHpoem5lZWJ2bGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDQ3MDUsImV4cCI6MjA4NTYyMDcwNX0.8V2oyXJWZRwRwhdFWY6CdBnXG6aGoRbCC42gOYmraS0';

export const supabase = createClient(supabaseUrl, supabaseKey);
