ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS dni text;
CREATE UNIQUE INDEX IF NOT EXISTS clientes_dni_unique ON public.clientes (dni) WHERE dni IS NOT NULL;