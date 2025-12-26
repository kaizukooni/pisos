import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Contratos = () => {
  const { usuario } = useAuth();
  const [contratos, setContratos] = useState([]);
  const [pisos, setPisos] = useState([]);
  const [habitaciones, setHabitaciones] = useState([]);
  const [inquilinos, setInquilinos] = useState([]);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [dialogDetalle, setDialogDetalle] = useState(false);
  const [contratoSeleccionado, setContratoSeleccionado] = useState(null);
  const [contratoEditar, setContratoEditar] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoPisos, setCargandoPisos] = useState(false);
  const [cargandoHabitaciones, setCargandoHabitaciones] = useState(false);
  const [cargandoInquilinos, setCargandoInquilinos] = useState(false);
  
  const [filtros, setFiltros] = useState({
    estado: 'all'
  });

  const [formData, setFormData] = useState({
    piso_id: '',
    habitacion_id: '',
    inquilino_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    renta_mensual: '',
    fianza: '',
    gastos_mensuales_tarifa: '50',
    tiene_limpieza: false,
    importe_limpieza_mensual: '',
    dia_pago: '1',
    estado: 'activo'
  });

  useEffect(() => {
    cargarDatos();
  }, [filtros]);

  const cargarDatos = async () => {
    try {
      setCargandoPisos(true);
      setCargandoHabitaciones(true);
      setCargandoInquilinos(true);
      const [pisosRes, habitacionesRes, inquilinosRes] = await Promise.all([
        axios.get(`${API}/pisos`),
        axios.get(`${API}/habitaciones`),
        axios.get(`${API}/inquilinos`)
      ]);
      
      setPisos(pisosRes.data);
      setHabitaciones(habitacionesRes.data);
      setInquilinos(inquilinosRes.data);
      
      await cargarContratos();
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setCargandoPisos(false);
      setCargandoHabitaciones(false);
      setCargandoInquilinos(false);
    }
  };

  const cargarContratos = async () => {
    try {
      let url = `${API}/contratos`;
      if (filtros.estado && filtros.estado !== 'all') {
        url += `?estado=${filtros.estado}`;
      }
      const response = await axios.get(url);
      setContratos(response.data);
    } catch (error) {
      toast.error('Error al cargar contratos');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      if (!formData.piso_id) {
        toast.error('Selecciona un piso');
        return;
      }
      if (!formData.habitacion_id) {
        toast.error('Selecciona una habitación');
        return;
      }
      if (!formData.inquilino_id) {
        toast.error('Selecciona un inquilino');
        return;
      }
      if (!formData.fecha_inicio || !formData.fecha_fin) {
        toast.error('Completa las fechas del contrato');
        return;
      }
      if (!formData.renta_mensual || !formData.fianza || !formData.gastos_mensuales_tarifa) {
        toast.error('Completa renta, fianza y gastos mensuales');
        return;
      }
      if (formData.tiene_limpieza && !formData.importe_limpieza_mensual) {
        toast.error('Indica la cantidad de limpieza mensual');
        return;
      }
      if (formData.tiene_limpieza && parseFloat(formData.importe_limpieza_mensual) <= 0) {
        toast.error('La cantidad de limpieza mensual debe ser mayor que 0');
        return;
      }
      if (!formData.dia_pago || parseInt(formData.dia_pago, 10) < 1 || parseInt(formData.dia_pago, 10) > 31) {
        toast.error('Indica un día de pago válido (1-31)');
        return;
      }
      const { piso_id, ...restForm } = formData;
      const datos = {
        ...restForm,
        fecha_inicio: new Date(restForm.fecha_inicio).toISOString(),
        fecha_fin: new Date(restForm.fecha_fin).toISOString(),
        renta_mensual: parseFloat(restForm.renta_mensual),
        fianza: parseFloat(restForm.fianza),
        gastos_mensuales_tarifa: parseFloat(restForm.gastos_mensuales_tarifa),
        importe_limpieza_mensual: restForm.tiene_limpieza
          ? parseFloat(restForm.importe_limpieza_mensual)
          : null,
        dia_pago: parseInt(restForm.dia_pago, 10)
      };

      if (contratoEditar) {
        await axios.put(`${API}/contratos/${contratoEditar._id}`, datos);
        toast.success('Contrato actualizado correctamente');
      } else {
        await axios.post(`${API}/contratos`, datos);
        toast.success('Contrato creado correctamente');
      }
      
      cargarContratos();
      cerrarDialog();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al guardar contrato');
    } finally {
      setCargando(false);
    }
  };

  const abrirDialog = () => {
    setFormData({
      piso_id: '',
      habitacion_id: '',
      inquilino_id: '',
      fecha_inicio: '',
      fecha_fin: '',
      renta_mensual: '',
      fianza: '',
      gastos_mensuales_tarifa: '50',
      tiene_limpieza: false,
      importe_limpieza_mensual: '',
      dia_pago: '1',
      estado: 'activo'
    });
    setContratoEditar(null);
    setDialogAbierto(true);
  };

  const cerrarDialog = () => {
    setDialogAbierto(false);
    setContratoEditar(null);
  };

  const verDetalle = (contrato) => {
    setContratoSeleccionado(contrato);
    setDialogDetalle(true);
  };

  const abrirEditar = (contrato) => {
    const habitacion = habitaciones.find((hab) => hab._id === contrato.habitacion_id);
    setContratoEditar(contrato);
    setFormData({
      piso_id: habitacion?.piso_id || '',
      habitacion_id: contrato.habitacion_id,
      inquilino_id: contrato.inquilino_id,
      fecha_inicio: contrato.fecha_inicio ? contrato.fecha_inicio.slice(0, 10) : '',
      fecha_fin: contrato.fecha_fin ? contrato.fecha_fin.slice(0, 10) : '',
      renta_mensual: contrato.renta_mensual?.toString() || '',
      fianza: contrato.fianza?.toString() || '',
      gastos_mensuales_tarifa: contrato.gastos_mensuales_tarifa?.toString() || '50',
      tiene_limpieza: contrato.tiene_limpieza || false,
      importe_limpieza_mensual: contrato.importe_limpieza_mensual?.toString() || '',
      dia_pago: contrato.dia_pago?.toString() || '1',
      estado: contrato.estado || 'activo'
    });
    setDialogAbierto(true);
  };

  const eliminarContrato = async (contrato) => {
    if (!window.confirm('¿Estás seguro de eliminar este contrato?')) return;
    try {
      await axios.delete(`${API}/contratos/${contrato._id}`);
      toast.success('Contrato eliminado correctamente');
      cargarContratos();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al eliminar contrato');
    }
  };

  const obtenerNombreHabitacion = (habitacionId) => {
    const habitacion = habitaciones.find(h => h._id === habitacionId);
    if (!habitacion) return 'N/A';
    const piso = pisos.find(p => p._id === habitacion.piso_id);
    return `${piso?.nombre || 'N/A'} - ${habitacion.nombre}`;
  };

  const obtenerNombreInquilino = (inquilinoId) => {
    const inquilino = inquilinos.find(i => i._id === inquilinoId);
    return inquilino?.nombre || 'N/A';
  };

  const puedeCrear = usuario?.rol === 'admin' || usuario?.rol === 'supervisor';
  const puedeEditar = usuario?.rol === 'admin' || usuario?.rol === 'supervisor';
  const habitacionesFiltradas = formData.piso_id
    ? habitaciones.filter((hab) => hab.piso_id === formData.piso_id)
    : [];

  return (
    <div data-testid="contratos-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Contratos</h1>
        {puedeCrear && (
          <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
            <DialogTrigger asChild>
              <Button onClick={abrirDialog} data-testid="crear-contrato-button">
                <Plus size={16} className="mr-2" />
                Nuevo Contrato
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{contratoEditar ? 'Editar Contrato' : 'Nuevo Contrato'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Piso *</Label>
                    <Select
                      value={formData.piso_id}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          piso_id: value,
                          habitacion_id: ''
                        })
                      }
                      required
                      disabled={!!contratoEditar}
                    >
                      <SelectTrigger data-testid="piso-select">
                        <SelectValue placeholder={cargandoPisos ? 'Cargando pisos...' : 'Selecciona un piso'} />
                      </SelectTrigger>
                      <SelectContent>
                        {pisos.map((piso) => (
                          <SelectItem key={piso._id} value={piso._id}>
                            {piso.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Habitación *</Label>
                    <Select
                      value={formData.habitacion_id}
                      onValueChange={(value) => setFormData({...formData, habitacion_id: value})}
                      required
                      disabled={!formData.piso_id || !!contratoEditar}
                    >
                      <SelectTrigger data-testid="habitacion-select">
                        <SelectValue
                          placeholder={
                            !formData.piso_id
                              ? 'Selecciona un piso primero'
                              : cargandoHabitaciones
                                ? 'Cargando habitaciones...'
                                : 'Selecciona una habitación'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {habitacionesFiltradas.length === 0 ? (
                          <SelectItem value="no-disponible" disabled>
                            Este piso no tiene habitaciones disponibles
                          </SelectItem>
                        ) : (
                          habitacionesFiltradas.map((hab) => (
                            <SelectItem key={hab._id} value={hab._id}>
                              {hab.nombre} ({hab.precio_base}€)
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Inquilino *</Label>
                    <Select
                      value={formData.inquilino_id}
                      onValueChange={(value) => setFormData({...formData, inquilino_id: value})}
                      required
                      disabled={!!contratoEditar}
                    >
                      <SelectTrigger data-testid="inquilino-select">
                        <SelectValue
                          placeholder={cargandoInquilinos ? 'Cargando inquilinos...' : 'Selecciona un inquilino'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {inquilinos.filter(i => i.activo).map(inq => (
                          <SelectItem key={inq._id} value={inq._id}>
                            {inq.nombre} - {inq.dni}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fecha_inicio">Fecha inicio *</Label>
                    <Input
                      id="fecha_inicio"
                      type="date"
                      value={formData.fecha_inicio}
                      onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                      required
                      data-testid="fecha-inicio-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fecha_fin">Fecha fin *</Label>
                    <Input
                      id="fecha_fin"
                      type="date"
                      value={formData.fecha_fin}
                      onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                      required
                      data-testid="fecha-fin-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="renta">Renta mensual (€) *</Label>
                    <Input
                      id="renta"
                      type="number"
                      step="0.01"
                      value={formData.renta_mensual}
                      onChange={(e) => setFormData({...formData, renta_mensual: e.target.value})}
                      required
                      data-testid="renta-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fianza">Fianza (€) *</Label>
                    <Input
                      id="fianza"
                      type="number"
                      step="0.01"
                      value={formData.fianza}
                      onChange={(e) => setFormData({...formData, fianza: e.target.value})}
                      required
                      data-testid="fianza-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gastos">Gastos mensuales (€) *</Label>
                    <Input
                      id="gastos"
                      type="number"
                      step="0.01"
                      value={formData.gastos_mensuales_tarifa}
                      onChange={(e) => setFormData({...formData, gastos_mensuales_tarifa: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="dia_pago">Día de pago mensual *</Label>
                    <Input
                      id="dia_pago"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.dia_pago}
                      onChange={(e) => setFormData({...formData, dia_pago: e.target.value})}
                      required
                    />
                  </div>
                  {contratoEditar && (
                    <div>
                      <Label>Estado *</Label>
                      <Select
                        value={formData.estado}
                        onValueChange={(value) => setFormData({...formData, estado: value})}
                        required
                      >
                        <SelectTrigger data-testid="estado-contrato-select">
                          <SelectValue placeholder="Selecciona estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="activo">Activo</SelectItem>
                          <SelectItem value="programado">Programado</SelectItem>
                          <SelectItem value="finalizado">Finalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="col-span-2 border-t pt-4">
                    <Label className="block text-sm font-medium text-gray-900 mb-2">Limpieza mensual</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="limpieza"
                        checked={formData.tiene_limpieza}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tiene_limpieza: e.target.checked,
                            importe_limpieza_mensual: e.target.checked ? formData.importe_limpieza_mensual : ''
                          })
                        }
                        className="rounded"
                      />
                      <Label htmlFor="limpieza" className="cursor-pointer">
                        Incluye limpieza
                      </Label>
                    </div>
                    <div className="mt-3">
                      <Label htmlFor="importe_limpieza">Cantidad limpieza mensual (€) *</Label>
                      <Input
                        id="importe_limpieza"
                        type="number"
                        step="0.01"
                        value={formData.importe_limpieza_mensual}
                        onChange={(e) => setFormData({...formData, importe_limpieza_mensual: e.target.value})}
                        disabled={!formData.tiene_limpieza}
                        required={formData.tiene_limpieza}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={cerrarDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={cargando} data-testid="guardar-contrato-button">
                    {cargando ? 'Guardando...' : 'Crear Contrato'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Filtrar por estado:</Label>
            <Select value={filtros.estado} onValueChange={(value) => setFiltros({...filtros, estado: value})}>
              <SelectTrigger className="w-48" data-testid="filtro-estado-select">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="programado">Programados</SelectItem>
                <SelectItem value="finalizado">Finalizados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Contratos ({contratos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inquilino</TableHead>
                <TableHead>Habitación</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Fecha Fin</TableHead>
                <TableHead>Renta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contratos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    No hay contratos registrados
                  </TableCell>
                </TableRow>
              ) : (
                contratos.map((contrato) => (
                  <TableRow key={contrato._id} data-testid={`contrato-row-${contrato._id}`}>
                    <TableCell className="font-medium">{obtenerNombreInquilino(contrato.inquilino_id)}</TableCell>
                    <TableCell>{obtenerNombreHabitacion(contrato.habitacion_id)}</TableCell>
                    <TableCell>{format(new Date(contrato.fecha_inicio), 'dd/MM/yyyy', { locale: es })}</TableCell>
                    <TableCell>{format(new Date(contrato.fecha_fin), 'dd/MM/yyyy', { locale: es })}</TableCell>
                    <TableCell>{contrato.renta_mensual.toFixed(2)} €</TableCell>
                    <TableCell>
                      {contrato.estado === 'activo' && (
                        <Badge className="bg-green-100 text-green-800">Activo</Badge>
                      )}
                      {contrato.estado === 'programado' && (
                        <Badge className="bg-blue-100 text-blue-800">Programado</Badge>
                      )}
                      {contrato.estado === 'finalizado' && (
                        <Badge variant="secondary">Finalizado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => verDetalle(contrato)}
                          data-testid={`ver-contrato-${contrato._id}`}
                        >
                          <Eye size={16} />
                        </Button>
                        {puedeEditar && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirEditar(contrato)}
                            data-testid={`editar-contrato-${contrato._id}`}
                          >
                            Editar
                          </Button>
                        )}
                        {puedeEditar && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => eliminarContrato(contrato)}
                            data-testid={`eliminar-contrato-${contrato._id}`}
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de detalle */}
      <Dialog open={dialogDetalle} onOpenChange={setDialogDetalle}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Contrato</DialogTitle>
          </DialogHeader>
          {contratoSeleccionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Inquilino</Label>
                  <p className="font-medium">{obtenerNombreInquilino(contratoSeleccionado.inquilino_id)}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Habitación</Label>
                  <p className="font-medium">{obtenerNombreHabitacion(contratoSeleccionado.habitacion_id)}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Fecha Inicio</Label>
                  <p className="font-medium">{format(new Date(contratoSeleccionado.fecha_inicio), 'dd/MM/yyyy', { locale: es })}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Fecha Fin</Label>
                  <p className="font-medium">{format(new Date(contratoSeleccionado.fecha_fin), 'dd/MM/yyyy', { locale: es })}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Renta Mensual</Label>
                  <p className="font-medium">{contratoSeleccionado.renta_mensual.toFixed(2)} €</p>
                </div>
                <div>
                  <Label className="text-gray-600">Fianza</Label>
                  <p className="font-medium">{contratoSeleccionado.fianza.toFixed(2)} €</p>
                </div>
                <div>
                  <Label className="text-gray-600">Gastos Mensuales</Label>
                  <p className="font-medium">{contratoSeleccionado.gastos_mensuales_tarifa.toFixed(2)} €</p>
                </div>
                <div>
                  <Label className="text-gray-600">Día de Pago</Label>
                  <p className="font-medium">Día {contratoSeleccionado.dia_pago}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Estado</Label>
                  <p className="font-medium capitalize">{contratoSeleccionado.estado}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Limpieza mensual</Label>
                  <p className="font-medium">
                    {contratoSeleccionado.tiene_limpieza
                      ? `${contratoSeleccionado.importe_limpieza_mensual?.toFixed(2) || '0.00'} €`
                      : 'No incluye'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contratos;
