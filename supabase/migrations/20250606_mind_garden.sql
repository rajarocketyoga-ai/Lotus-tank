-- Create garden_plants table
CREATE TABLE IF NOT EXISTS public.garden_plants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plant_type TEXT NOT NULL,
    growth_stage INTEGER DEFAULT 1, -- 1: Seed, 2: Sprout, 3: Small Plant, 4: Flower, 5: Tree
    planted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_watered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    xp_invested INTEGER DEFAULT 0,
    position_index INTEGER NOT NULL -- Grid position in the garden
);

-- Enable RLS
ALTER TABLE public.garden_plants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own plants" ON public.garden_plants
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plants" ON public.garden_plants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plants" ON public.garden_plants
    FOR UPDATE USING (auth.uid() = user_id);
