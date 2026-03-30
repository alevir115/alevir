
CREATE TABLE public.clientes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    apellido TEXT NOT NULL,
    nombre TEXT NOT NULL,
    cuit TEXT NOT NULL,
    telefono TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select" ON public.clientes FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.clientes FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.clientes FOR DELETE USING (true);
