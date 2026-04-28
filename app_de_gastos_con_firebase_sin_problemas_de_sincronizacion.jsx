import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_URL = "https://script.google.com/macros/s/AKfycbxkYDjdMNNzT1Q8KSL8sAfWih7F4tTjUDdzhYcOBgvZStI8A5IE-AXisuhb6TjYpSVx/exec";

export default function AppGastos() {
  const [usuario, setUsuario] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [logueado, setLogueado] = useState(false);

  const [cambiandoPin, setCambiandoPin] = useState(false);
  const [nuevoPin, setNuevoPin] = useState("");

  const [gastos, setGastos] = useState(() => {
    try {
      const guardados = localStorage.getItem("gastos");
      return guardados ? JSON.parse(guardados) : [];
    } catch {
      return [];
    }
  });

  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [tipo, setTipo] = useState("hogar");

  useEffect(() => {
    localStorage.setItem("gastos", JSON.stringify(gastos));
  }, [gastos]);

  // 🔐 LOGIN / CREAR PIN (4 dígitos recomendado)
  const login = () => {
    const key = "pin_" + usuario;
    const guardado = localStorage.getItem(key);

    if (!guardado) {
      localStorage.setItem(key, pinInput);
      setLogueado(true);
      return;
    }

    if (guardado === pinInput) {
      setLogueado(true);
    } else {
      alert("PIN incorrecto");
    }
  };

  // 🔁 CAMBIAR PIN
  const cambiarPin = () => {
    if (!nuevoPin) return;

    if (nuevoPin.length < 4) {
      alert("El PIN debe tener al menos 4 dígitos");
      return;
    }

    const confirmar = confirm("¿Seguro que quieres cambiar el PIN?");

    if (!confirmar) return;

    const key = "pin_" + usuario;
    localStorage.setItem(key, nuevoPin);

    setNuevoPin("");
    setCambiandoPin(false);

    alert("PIN actualizado");
  };

  const agregarGasto = async () => {
    if (!descripcion || !monto) return;

    const fecha = new Date();

    const nuevoGasto = {
      id: Date.now(),
      descripcion,
      monto: parseFloat(monto),
      tipo,
      usuario: tipo === "personal" ? usuario : "hogar",
      fechaCompleta: fecha.toLocaleDateString(),
      fechaISO: fecha.toISOString().split("T")[0],
    };

    setGastos((prev) => [...prev, nuevoGasto]);
    setDescripcion("");
    setMonto("");

    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          descripcion: nuevoGasto.descripcion,
          monto: nuevoGasto.monto,
          tipo: nuevoGasto.tipo,
          usuario: nuevoGasto.usuario,
          fechaCompleta: nuevoGasto.fechaCompleta,
          fechaISO: nuevoGasto.fechaISO,
        }),
      });
    } catch {}
  };

  const eliminarGasto = (id) => {
    setGastos(gastos.filter((g) => g.id !== id));
  };

  const total = (lista) => lista.reduce((acc, g) => acc + g.monto, 0);

  const agruparPorDia = (lista) => {
    const agrupado = {};

    lista.forEach((g) => {
      const key = g.fechaISO;
      if (!agrupado[key]) agrupado[key] = [];
      agrupado[key].push(g);
    });

    return Object.entries(agrupado).sort(
      (a, b) => new Date(b[0]) - new Date(a[0])
    );
  };

  const gastosHogar = gastos.filter((g) => g.tipo === "hogar");
  const gastosPersonales = gastos.filter(
    (g) => g.tipo === "personal" && g.usuario === usuario
  );

  if (!usuario) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-xl mb-4">Selecciona usuario</h1>
        <Button onClick={() => setUsuario("nico")}>👤 Nico</Button>
        <Button onClick={() => setUsuario("javi")}>👤 Javi</Button>
      </div>
    );
  }

  if (!logueado) {
    return (
      <div className="p-4 text-center">
        <h2 className="mb-2">🔐 PIN de {usuario}</h2>

        <Input
          type="number"
          placeholder="Ingresa o crea PIN"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
        />

        <Button onClick={login} className="mt-2">
          Entrar
        </Button>
      </div>
    );
  }

  const Seccion = ({ titulo, lista }) => (
    <Card>
      <CardContent className="p-4">
        <h2 className="font-bold mb-2">{titulo}</h2>

        {agruparPorDia(lista).map(([fecha, items]) => (
          <div key={fecha}>
            <p>📅 {items[0].fechaCompleta}</p>

            {items.map((g) => (
              <div key={g.id} className="flex justify-between">
                <span>{g.descripcion}</span>
                <span>${g.monto}</span>
                <button onClick={() => eliminarGasto(g.id)}>✕</button>
              </div>
            ))}

            <b>Total día: ${total(items)}</b>
          </div>
        ))}

        <b>Total: ${total(lista)}</b>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4">
      <h1 className="text-xl mb-2">Control de Gastos</h1>

      <div className="flex gap-2 mb-2">
        <Button onClick={() => setLogueado(false)}>Cerrar sesión</Button>
        <Button onClick={() => setCambiandoPin(!cambiandoPin)}>
          Cambiar PIN
        </Button>
      </div>

      {cambiandoPin && (
        <div className="mb-4">
          <Input
            type="number"
            placeholder="Nuevo PIN"
            value={nuevoPin}
            onChange={(e) => setNuevoPin(e.target.value)}
          />
          <Button onClick={cambiarPin} className="mt-2">
            Guardar nuevo PIN
          </Button>
        </div>
      )}

      <div className="my-4">
        <Input
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />

        <Input
          type="number"
          placeholder="Monto"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
        />

        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="hogar">Hogar</option>
          <option value="personal">Personal</option>
        </select>

        <Button onClick={agregarGasto}>Agregar</Button>
      </div>

      <Seccion titulo="🏠 Hogar" lista={gastosHogar} />
      <Seccion titulo={`👤 ${usuario}`} lista={gastosPersonales} />

      <div>
        <b>Total general: ${total(gastos)}</b>
      </div>
    </div>
  );
}
