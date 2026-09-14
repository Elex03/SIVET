import { memo } from 'react';
import PageHeader from "../../shared/components/Layout/PageHeader";

const Bodega = () => {
  return (
    <div className="p-6 w-full">
      <PageHeader 
        header="Inventario General" 
        sub="Gestiona los productos, medicamentos y suministros disponibles." 
      />
      
      <div className="mt-4 bg-white rounded-lg shadow-sm border p-4">
        Tabla de inventario...
      </div>
    </div>
  );
};

export default memo(Bodega);