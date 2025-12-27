import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { Plus, Trash2, Edit2, Save, X, Home, Printer, CheckSquare, Square, LogOut, Users } from 'lucide-react';

// --- Componentes UI ---
const Card = ({ title, value, subtext, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-gray-200" style={{ borderColor: color }}>
    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</h3>
    <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
    {subtext && <p className={`text-sm mt-1 font-medium ${subtext.includes('-') ? 'text-red-500' : 'text-green-600'}`}>{subtext}</p>}
  </div>
);

export default function App() {
  // Estado de Sesión (Nombre de la sala)
  const [roomName, setRoomName] = useState(localStorage.getItem('my-room-name') || '');
  const [isJoined, setIsJoined] = useState(!!localStorage.getItem('my-room-name'));
  
  // Estado de la App
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    id: null, name: '', room: 'Salón', quantity: 1, budgetPrice: 0, realPrice: 0, purchased: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [filterRoom, setFilterRoom] = useState('Todos');
  const [loading, setLoading] = useState(true);

  // --- LOGICA DE FIREBASE ---
  useEffect(() => {
    if (!isJoined || !roomName) return;

    // Escuchar cambios en tiempo real en la base de datos
    const itemsRef = ref(db, `rooms/${roomName}/items`);
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convertir objeto de objetos a array
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setItems(list);
      } else {
        setItems([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isJoined, roomName]);

  // --- MANEJADORES DE ACCIÓN ---
  const handleJoin = (e) => {
    e.preventDefault();
    if(!roomName.trim()) return;
    localStorage.setItem('my-room-name', roomName); // Guardar sesión
    setIsJoined(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('my-room-name');
    setIsJoined(false);
    setRoomName('');
    setItems([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      // Actualizar en Firebase
      const itemRef = ref(db, `rooms/${roomName}/items/${formData.id}`);
      update(itemRef, {
        name: formData.name, room: formData.room, quantity: formData.quantity,
        budgetPrice: formData.budgetPrice, realPrice: formData.realPrice
      });
      setIsEditing(false);
    } else {
      // Crear en Firebase
      const listRef = ref(db, `rooms/${roomName}/items`);
      push(listRef, { ...formData, purchased: false });
    }
    resetForm();
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Borrar ítem permanentemente?')) {
      remove(ref(db, `rooms/${roomName}/items/${id}`));
    }
  };

  const togglePurchased = (item) => {
    update(ref(db, `rooms/${roomName}/items/${item.id}`), {
      purchased: !item.purchased
    });
  };

  // --- UTILIDADES ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' || name.includes('Price') ? parseFloat(value) || 0 : value
    });
  };

  const resetForm = () => setFormData({ id: null, name: '', room: 'Salón', quantity: 1, budgetPrice: 0, realPrice: 0, purchased: false });
  
  const handleEdit = (item) => {
    setFormData(item);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const rooms = ['Salón', 'Cocina', 'Baño', 'Dormitorio P.', 'Dormitorio 2', 'Entrada', 'Terraza', 'General'];
  
  // Filtrado y Cálculos
  const filteredItems = filterRoom === 'Todos' ? items : items.filter(item => item.room === filterRoom);
  const totalBudget = filteredItems.reduce((acc, item) => acc + (item.budgetPrice * item.quantity), 0);
  const totalSpent = filteredItems.reduce((acc, item) => acc + (item.realPrice * item.quantity), 0);
  const difference = totalBudget - totalSpent;

  // --- VISTA: LOGIN (Selección de Sala) ---
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white">
            <Users size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Bienvenido a MiPiso</h1>
          <p className="text-gray-500 mb-6">Crea un espacio compartido o entra en uno existente.</p>
          <form onSubmit={handleJoin} className="space-y-4">
            <input 
              type="text" 
              placeholder="Nombre del Espacio (ej: PisoMadrid)" 
              value={roomName}
              onChange={(e) => setRoomName(e.target.value.replace(/\s/g, ''))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-center text-lg uppercase tracking-wide"
            />
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition">
              Entrar al Espacio
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-4">Comparte este nombre con quien quieras que vea la lista.</p>
        </div>
      </div>
    );
  }

  // --- VISTA: APP PRINCIPAL ---
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800 print:bg-white print:p-0">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Home size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Espacio: {roomName}</h1>
            </div>
          </div>
          <div className="flex gap-2">
             <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm">
                <Printer size={16} /> <span className="hidden sm:inline">PDF</span>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-red-500 rounded hover:bg-gray-50 text-sm">
                <LogOut size={16} /> <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        {/* Loading State */}
        {loading && <div className="text-center py-4">Cargando datos de la nube...</div>}

        {/* Filtros */}
        <div className="flex overflow-x-auto pb-2 mb-6 gap-2 print:hidden scrollbar-hide">
          <button onClick={() => setFilterRoom('Todos')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterRoom === 'Todos' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-600 border'}`}>Todos</button>
          {rooms.map(r => (
            <button key={r} onClick={() => setFilterRoom(r)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterRoom === r ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-600 border'}`}>{r}</button>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 print:grid-cols-3">
          <Card title={`Presupuesto (${filterRoom})`} value={`${totalBudget.toFixed(0)} €`} color="#4F46E5" />
          <Card title="Gasto Real" value={`${totalSpent.toFixed(0)} €`} color="#10B981" />
          <Card title="Balance" value={`${Math.abs(difference).toFixed(0)} €`} subtext={difference >= 0 ? "+ Ahorro" : "- Déficit"} color={difference >= 0 ? "#10B981" : "#EF4444"} />
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200 print:hidden">
          <h2 className="text-sm font-bold uppercase text-gray-500 mb-4 flex items-center gap-2">
            {isEditing ? <Edit2 size={16}/> : <Plus size={16}/>} {isEditing ? 'Editar Ítem' : 'Añadir Nuevo'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-4"><input required name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2 bg-gray-50 border rounded outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nombre (ej. Lámpara)" /></div>
            <div className="lg:col-span-2">
               <select name="room" value={formData.room} onChange={handleInputChange} className="w-full p-2 bg-gray-50 border rounded outline-none focus:ring-2 focus:ring-indigo-500">
                {rooms.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="lg:col-span-1"><input type="number" min="1" name="quantity" value={formData.quantity} onChange={handleInputChange} className="w-full p-2 bg-gray-50 border rounded outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Cant." /></div>
            <div className="lg:col-span-2"><input type="number" step="0.1" name="budgetPrice" value={formData.budgetPrice} onChange={handleInputChange} className="w-full p-2 bg-gray-50 border rounded outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Presup." /></div>
            <div className="lg:col-span-2"><input type="number" step="0.1" name="realPrice" value={formData.realPrice} onChange={handleInputChange} className="w-full p-2 bg-gray-50 border rounded outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Real" /></div>
            <div className="lg:col-span-1"><button type="submit" className="w-full h-full bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center justify-center"><Save size={18} /></button></div>
          </form>
           {isEditing && <button onClick={resetForm} className="text-xs text-red-500 mt-2 underline">Cancelar edición</button>}
        </div>

        {/* Lista */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="p-4 w-10"></th>
                  <th className="p-4">Ítem</th>
                  <th className="p-4 text-center">Cant.</th>
                  <th className="p-4 text-right">Presup.</th>
                  <th className="p-4 text-right">Real</th>
                  <th className="p-4 text-center print:hidden">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredItems.map(item => (
                  <tr key={item.id} className={item.purchased ? 'bg-green-50/40' : 'hover:bg-gray-50'}>
                    <td className="p-4 text-center">
                       <button onClick={() => togglePurchased(item)} className="text-gray-400 hover:text-indigo-600 print:hidden">
                         {item.purchased ? <CheckSquare size={18} className="text-green-600"/> : <Square size={18}/>}
                       </button>
                    </td>
                    <td className="p-4">
                      <div className={`font-medium text-gray-900 ${item.purchased && 'line-through text-gray-400'}`}>{item.name}</div>
                      <div className="text-xs text-gray-400">{item.room}</div>
                    </td>
                    <td className="p-4 text-center">{item.quantity}</td>
                    <td className="p-4 text-right text-gray-500">{(item.budgetPrice * item.quantity).toFixed(0)}€</td>
                    <td className={`p-4 text-right font-bold ${item.realPrice * item.quantity > item.budgetPrice * item.quantity ? 'text-red-500' : 'text-gray-800'}`}>
                      {item.realPrice > 0 ? (item.realPrice * item.quantity).toFixed(0) + '€' : '-'}
                    </td>
                    <td className="p-4 flex justify-center gap-2 print:hidden">
                      <button onClick={() => handleEdit(item)}><Edit2 size={16} className="text-indigo-600"/></button>
                      <button onClick={() => handleDelete(item.id)}><Trash2 size={16} className="text-red-400"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredItems.length === 0 && <div className="p-8 text-center text-gray-400">Lista vacía.</div>}
        </div>
      </div>
    </div>
  );
}