import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { categoriasService } from '@/services/backend/categoriasService';
import type { Categoria } from '@/types';
import { Plus, Pencil, Trash2, Check, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categorias: Categoria[];
  onCategoriesChanged: () => void;
  onCategorySelected?: (idCategoria: number) => void;
}

interface ConfirmCategoryData {
  nombre: string;
  color: string;
  isEditing: boolean;
  id?: number;
}

interface SuccessCategoryData {
  nombre: string;
  color: string;
  isEditing: boolean;
}

const PRESET_COLORS = [
  '#ef4444', // Rojo
  '#f97316', // Naranja
  '#f59e0b', // Ámbar
  '#10b981', // Esmeralda
  '#06b6d4', // Cian
  '#3b82f6', // Azul
  '#6366f1', // Índigo
  '#8b5cf6', // Púrpura
  '#ec4899', // Rosa
  '#64748b', // Slate
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categorias,
  onCategoriesChanged,
  onCategorySelected,
}) => {
  const [localCategorias, setLocalCategorias] = useState<Categoria[]>(categorias);
  const [nombre, setNombre] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[5]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de Modales de Confirmación y Éxito
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<ConfirmCategoryData | null>(null);

  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successData, setSuccessData] = useState<SuccessCategoryData | null>(null);

  // Modal de Eliminación
  const [categoryToDelete, setCategoryToDelete] = useState<Categoria | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sincronizar categorías locales al abrir o cuando cambia el prop categorias
  useEffect(() => {
    setLocalCategorias(categorias);
  }, [categorias]);

  useEffect(() => {
    if (isOpen) {
      setLocalCategorias(categorias);
      categoriasService
        .getAll()
        .then((fresh) => {
          if (fresh && fresh.length >= 0) {
            setLocalCategorias(fresh);
          }
        })
        .catch((err) => console.error('Error al sincronizar categorías:', err));
    }
  }, [isOpen]);

  const resetForm = () => {
    setNombre('');
    setSelectedColor(PRESET_COLORS[5]);
    setEditingId(null);
  };

  const handleEditClick = (c: Categoria) => {
    setEditingId(c.idCategoria);
    setNombre(c.nombre);
    setSelectedColor(c.color || PRESET_COLORS[5]);
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  // 1. Al enviar el formulario, abrir modal de confirmación
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('Ingresa un nombre para la categoría');
      return;
    }

    setConfirmData({
      nombre: nombre.trim(),
      color: selectedColor,
      isEditing: Boolean(editingId),
      id: editingId || undefined,
    });
    setIsConfirmOpen(true);
  };

  // 2. Al confirmar, ejecutar el guardado en backend y refrescar la lista
  const executeSaveCategory = async () => {
    if (!confirmData) return;

    setIsSubmitting(true);
    try {
      let createdId: number | undefined;

      if (confirmData.isEditing && confirmData.id) {
        // Actualizar
        await categoriasService.update(confirmData.id, {
          nombre: confirmData.nombre,
          colorHex: confirmData.color,
          icono: 'package',
          activo: true,
        });
        toast.success(`Categoría "${confirmData.nombre}" actualizada`);
      } else {
        // Crear
        createdId = await categoriasService.create({
          nombre: confirmData.nombre,
          colorHex: confirmData.color,
          icono: 'package',
        });
        toast.success(`Categoría "${confirmData.nombre}" creada con éxito`);
      }

      // Obtener categorías frescas de inmediato para actualizar la lista en tiempo real
      const freshCats = await categoriasService.getAll();
      setLocalCategorias(freshCats || []);

      // Notificar al componente padre
      onCategoriesChanged();
      if (!confirmData.isEditing && createdId && onCategorySelected) {
        onCategorySelected(createdId);
      }

      // Datos para el modal de éxito
      setSuccessData({
        nombre: confirmData.nombre,
        color: confirmData.color,
        isEditing: confirmData.isEditing,
      });

      // Cerrar confirmación y abrir modal de éxito
      setIsConfirmOpen(false);
      setIsSuccessOpen(true);

      // Limpiar formulario
      resetForm();
    } catch (err: any) {
      console.error('Error al guardar categoría:', err);
      toast.error('Error al guardar categoría');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Confirmar y ejecutar eliminación de categoría
  const executeDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      await categoriasService.delete(categoryToDelete.idCategoria);
      toast.success(`Categoría "${categoryToDelete.nombre}" eliminada`);
      if (editingId === categoryToDelete.idCategoria) {
        resetForm();
      }

      const freshCats = await categoriasService.getAll();
      setLocalCategorias(freshCats || []);
      onCategoriesChanged();
      setCategoryToDelete(null);
    } catch (err: any) {
      console.error('Error al eliminar categoría:', err);
      toast.error('No se pudo eliminar la categoría');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          resetForm();
          onClose();
        }}
        title="Categorías del Negocio"
        position="bottom"
      >
        <div className="space-y-4">
          {/* Formulario de Crear / Editar */}
          <form
            onSubmit={handleFormSubmit}
            className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-red-500" />
                {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
              </span>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancelar edición
                </button>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                Nombre de la Categoría
              </label>
              <input
                type="text"
                placeholder="Ej: Abarrotes, Limpieza, Lácteos, Snacks"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-semibold outline-none focus:border-red-500"
                autoFocus
              />
            </div>

            {/* Selector de color de la categoría */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1.5">
                Color distintivo
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      selectedColor === c
                        ? 'ring-3 ring-offset-2 ring-slate-800 scale-110 shadow-sm'
                        : 'opacity-85 hover:opacity-100'
                    }`}
                    title={c}
                  >
                    {selectedColor === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full h-11 rounded-xl text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                  editingId
                    ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-800/30'
                    : 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
                }`}
              >
                {editingId ? (
                  <span>Guardar Cambios</span>
                ) : (
                  <>
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Crear Categoría</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Lista de Categorías Existentes */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold text-slate-500 uppercase">
                Categorías activas ({localCategorias.length})
              </span>
            </div>

            {localCategorias.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                Aún no has creado categorías. Crea la primera arriba.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                {localCategorias.map((cat) => (
                  <div
                    key={cat.idCategoria}
                    className={`bg-white rounded-xl p-2.5 border flex items-center justify-between gap-2 transition-all ${
                      editingId === cat.idCategoria
                        ? 'border-red-500 bg-red-50/20 ring-2 ring-red-500/10'
                        : 'border-slate-200/90'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: cat.color || '#3b82f6' }}
                      />
                      <span className="font-extrabold text-sm text-slate-800 truncate">
                        {cat.nombre}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditClick(cat)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                        title="Editar categoría"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryToDelete(cat)}
                        className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                        title="Eliminar categoría"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* MODAL: CONFIRMACIÓN AL REGISTRAR / ACTUALIZAR CATEGORÍA */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeSaveCategory}
        title={confirmData?.isEditing ? '¿Actualizar Categoría?' : '¿Confirmar Nueva Categoría?'}
        description={
          confirmData?.isEditing
            ? 'Los cambios se aplicarán en todos los productos asociados a esta categoría.'
            : 'Verifica los datos antes de agregar la categoría al catálogo de tu negocio.'
        }
        confirmText={confirmData?.isEditing ? 'Sí, Actualizar' : 'Sí, Crear Categoría'}
        cancelText="Volver a Revisar"
        variant="primary"
        isLoading={isSubmitting}
        zIndex="z-[60]"
        details={
          confirmData
            ? [
                { label: 'Nombre de Categoría', value: confirmData.nombre },
                {
                  label: 'Color Distintivo',
                  value: (
                    <span className="inline-flex items-center gap-2 font-bold">
                      <span
                        className="w-3.5 h-3.5 rounded-full inline-block shadow-xs border border-slate-300"
                        style={{ backgroundColor: confirmData.color }}
                      />
                      <span className="text-xs uppercase">{confirmData.color}</span>
                    </span>
                  ),
                },
              ]
            : undefined
        }
      />

      {/* MODAL: ÉXITO AL REGISTRAR / ACTUALIZAR CATEGORÍA */}
      <SuccessModal
        isOpen={isSuccessOpen}
        onClose={() => {
          setIsSuccessOpen(false);
          setSuccessData(null);
        }}
        title={
          successData?.isEditing
            ? '¡Categoría Actualizada!'
            : '¡Categoría Registrada con Éxito!'
        }
        message={
          successData?.isEditing
            ? `La categoría "${successData?.nombre}" ha sido modificada correctamente.`
            : `La categoría "${successData?.nombre}" se registró exitosamente y ya está activa en tu negocio.`
        }
        primaryActionText="Entendido"
        onPrimaryAction={() => {
          setIsSuccessOpen(false);
          setSuccessData(null);
        }}
        zIndex="z-[60]"
        details={
          successData
            ? [
                { label: 'Categoría', value: successData.nombre },
                {
                  label: 'Color Distintivo',
                  value: (
                    <span className="inline-flex items-center gap-2 font-bold">
                      <span
                        className="w-3.5 h-3.5 rounded-full inline-block shadow-xs border border-slate-300"
                        style={{ backgroundColor: successData.color }}
                      />
                      <span className="text-xs uppercase">{successData.color}</span>
                    </span>
                  ),
                },
                { label: 'Estado', value: 'Activa en el Negocio', highlight: true },
              ]
            : undefined
        }
      />

      {/* MODAL: CONFIRMACIÓN DE ELIMINACIÓN DE CATEGORÍA */}
      <ConfirmModal
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={executeDeleteCategory}
        title="¿Eliminar Categoría?"
        description={`¿Estás seguro de que deseas eliminar la categoría "${categoryToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
        zIndex="z-[60]"
        details={
          categoryToDelete
            ? [
                { label: 'Categoría', value: categoryToDelete.nombre },
                {
                  label: 'Color Distintivo',
                  value: (
                    <span className="inline-flex items-center gap-2 font-bold">
                      <span
                        className="w-3.5 h-3.5 rounded-full inline-block shadow-xs border border-slate-300"
                        style={{ backgroundColor: categoryToDelete.color || '#3b82f6' }}
                      />
                      <span className="text-xs uppercase">{categoryToDelete.color || '#3b82f6'}</span>
                    </span>
                  ),
                },
              ]
            : undefined
        }
      />
    </>
  );
};
