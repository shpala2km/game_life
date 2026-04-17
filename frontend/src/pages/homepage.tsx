import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

import '@/pages/homepage.css';
import { GameEngine } from '@/core/GameEngine';
import { SHAPE_TEMPLATES } from '@/core/shapeTemplates';
import { getCellClass } from '@/modules/cellAppearance';
import Rules from '@/modules/rules';
import Navbar from '@/modules/navbar';

const API_URL = 'http://127.0.0.1:8000/api';

function HomePage() {
  const [isLoggedIn] = useState(!!localStorage.getItem('access_token'));

  const sizes = [16, 8, 25, 36];
  const speeds = [1000, 200, 100, 50];
  const speedLabels = ['x1', 'x5', 'x10', 'x20'];

  const [size, setSize] = useState(sizes[0]);
  const [grid, setGrid] = useState<number[][]>([]);
  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(0);

  const [isInverting, setIsInverting] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [userSaves, setUserSaves] = useState<any[]>([]);
  const [selectedSaveId, setSelectedSaveId] = useState<number | null>(null);

  const engineRef = useRef<GameEngine | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const FIELD_SIZE = 500;

  // Axios с токеном
  const api = axios.create({ baseURL: API_URL });
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // Инициализация движка
  useEffect(() => {
    const engine = new GameEngine(size, { birth: [3], survival: [2, 3] });
    engineRef.current = engine;
    setGrid(engine.getGrid());
  }, [size]);

  // Обновление популяции
  useEffect(() => {
    const pop = grid.flat().filter(cell => cell > 0).length;
    setPopulation(pop);
  }, [grid]);

  // Загрузка сохранений пользователя
  const loadUserSaves = async () => {
    if (!isLoggedIn) return;
    try {
      const res = await api.get('/games/my/');
      setUserSaves(res.data);
    } catch (err) {
      console.error('Ошибка загрузки сохранений:', err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) loadUserSaves();
  }, [isLoggedIn]);

  // Симуляция
  useEffect(() => {
    if (!engineRef.current) return;

    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const result = engineRef.current!.step();
        setGrid(result.newGrid);
        setGeneration(result.newGeneration);
        if (result.shouldStop) setIsRunning(false);
      }, speeds[speedIndex]);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, speedIndex]);

  // ====================== СОХРАНЕНИЕ ======================
  const handleSaveToServer = async () => {
    if (!engineRef.current || !saveName.trim()) {
      alert('Введите название сохранения');
      return;
    }

    const data = {
      ...engineRef.current.toJSON(),
      name: saveName.trim(),
    };

    try {
      await api.post('/games/', data);
      alert('✅ Игра сохранена на сервере!');
      setSaveName('');
      loadUserSaves();
    } catch (err: any) {
      alert('Ошибка сохранения: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleSaveToComputer = () => {
    if (!engineRef.current) return;
    const data = engineRef.current.toJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `game_of_life_${size}x${size}_gen${generation}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ====================== ЗАГРУЗКА И УДАЛЕНИЕ ======================
  const handleLoadGame = (save: any) => {
    if (!engineRef.current) return;

    engineRef.current.loadFromJSON(save);
    setSize(engineRef.current.getSize());
    setGrid(engineRef.current.getGrid());
    setGeneration(engineRef.current.getGeneration());
    setIsRunning(false);
    setSelectedSaveId(save.id);

    alert(`✅ Загружена: ${save.name}`);
  };

  const handleDeleteSave = async (id: number, name: string) => {
    if (!window.confirm(`Удалить сохранение "${name}"?`)) return;

    try {
      await api.delete(`/games/${id}/`);
      alert('Сохранение удалено');
      loadUserSaves();
      if (selectedSaveId === id) setSelectedSaveId(null);
    } catch (err: any) {
      alert('Ошибка удаления: ' + (err.response?.data?.detail || err.message));
    }
  };

  // ====================== Основные действия ======================
  const handleStart = () => setIsRunning(true);
  const handleStop = () => setIsRunning(false);

  const handleRandom = () => {
    engineRef.current?.randomize();
    setGrid(engineRef.current!.getGrid());
    setGeneration(0);
    setIsRunning(false);
  };

  const handleNext = () => {
    if (!engineRef.current) return;
    const result = engineRef.current.step();
    setGrid(result.newGrid);
    setGeneration(result.newGeneration);
  };

  const handleClear = () => {
    engineRef.current?.clear();
    setGrid(engineRef.current!.getGrid());
    setGeneration(0);
    setIsRunning(false);
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value, 10);
    setSize(newSize);
    engineRef.current?.setSize(newSize);
    setGrid(engineRef.current!.getGrid());
    setGeneration(0);
    setIsRunning(false);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSpeedIndex(parseInt(e.target.value, 10));
  };

  const applyShape = (template: string[]) => {
    engineRef.current?.applyShape(template);
    setGrid(engineRef.current!.getGrid());
    setGeneration(0);
    setIsRunning(false);
  };

  // Рисование мышью
  const handleMouseDown = (i: number, j: number) => {
    setIsInverting(true);
    engineRef.current?.toggleCell(i, j);
    setGrid(engineRef.current!.getGrid());
  };

  const handleMouseEnter = (i: number, j: number) => {
    if (isInverting && engineRef.current) {
      engineRef.current.toggleCell(i, j);
      setGrid(engineRef.current.getGrid());
    }
  };

  const handleMouseUp = () => setIsInverting(false);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const isStartDisabled = isRunning || population === 0;

  return (
    <div className="app">
      <Navbar />

      <div className="main-content">
        {/* Игровое поле */}
        <div className="field-container">
          <div
            className="grid"
            style={{
              width: FIELD_SIZE * size / 10,
              height: FIELD_SIZE * size / 10,
              gridTemplateColumns: `repeat(${size}, 1fr)`,
              gridTemplateRows: `repeat(${size}, 1fr)`,
            }}
            onMouseLeave={() => setIsInverting(false)}
          >
            {grid.map((row, i) =>
              row.map((cellValue, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`cell ${getCellClass(cellValue)}`.trim()}
                  onMouseDown={() => handleMouseDown(i, j)}
                  onMouseEnter={() => handleMouseEnter(i, j)}
                />
              ))
            )}
          </div>
        </div>

        {/* Панель управления */}
        <div className="controls-panel">
          <div className="button-group">
            <button onClick={handleStart} className="start-btn" disabled={isStartDisabled}>Старт</button>
            <button onClick={handleStop} className="stop-btn" disabled={!isRunning}>Стоп</button>
            <button onClick={handleRandom}>Случайное заполнение</button>
            <button onClick={handleNext}>Следующий шаг</button>
            <button onClick={handleClear}>Очистить</button>
          </div>

          {/* Сохранение */}
          {isLoggedIn && (
            <div className="save-section">
              <input
                className="save-name"
                type="text"
                placeholder="Название сохранения"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleSaveToServer} style={{ flex: 1, background: '#05a931' }}>
                  💾 Сохранить на сервер
                </button>
                <button onClick={handleSaveToComputer} style={{ flex: 1 }}>
                  💻 Сохранить на компьютер
                </button>
              </div>
            </div>
          )}

          {/* Мои сохранения */}
          {isLoggedIn && (
            <div className="save-section" style={{ marginTop: '15px' }}>
              <label style={{ color: '#a0b0d0', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                Мои сохранения:
              </label>
              <select
                value={selectedSaveId || ''}
                onChange={(e) => {
                  const save = userSaves.find(s => s.id === Number(e.target.value));
                  if (save) handleLoadGame(save);
                }}
                style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
              >
                <option value="">— Выберите сохранение —</option>
                {userSaves.map((save) => (
                  <option key={save.id} value={save.id}>
                    {save.name} ({save.size}×{save.size}) — ген. {save.generation}
                  </option>
                ))}
              </select>

              {selectedSaveId && (
                <button
                  onClick={() => {
                    const save = userSaves.find(s => s.id === selectedSaveId);
                    if (save) handleDeleteSave(save.id, save.name);
                  }}
                  style={{ width: '100%', background: '#b70404', color: 'white' }}
                >
                  🗑 Удалить выбранное сохранение
                </button>
              )}
            </div>
          )}

          {/* Шаблоны */}
          <div className="button-group">
            <label style={{ color: '#a0b0d0', fontWeight: '600' }}>Шаблоны:</label>
            {Object.keys(SHAPE_TEMPLATES).map((key) => (
              <button
                key={key}
                onClick={() => applyShape(SHAPE_TEMPLATES[key as keyof typeof SHAPE_TEMPLATES])}
                style={{ fontSize: '13px', padding: '8px 12px' }}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>

          {/* Настройки */}
          <div className="select-group">
            <div>
              <label>Размер поля</label>
              <select value={size} onChange={handleSizeChange}>
                {sizes.map((s) => <option key={s} value={s}>{`${s}×${s}`}</option>)}
              </select>
            </div>

            <div>
              <label>Скорость</label>
              <select value={speedIndex} onChange={handleSpeedChange}>
                {speedLabels.map((label, idx) => (
                  <option key={idx} value={idx}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="info">
            <p>Популяция: {population}</p>
            <p>Поколение: {generation}</p>
          </div>
        </div>
      </div>

      <div className="rules-container">
        <Rules />
      </div>
    </div>
  );
}

export default HomePage;