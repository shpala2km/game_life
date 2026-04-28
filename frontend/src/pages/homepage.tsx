import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

import '@/pages/homepage.css';
import { GameEngine } from '@/core/GameEngine';
import { SHAPE_TEMPLATES } from '@/core/shapeTemplates';
import { getCellClass } from '@/modules/cellAppearance';
import Rules from '@/modules/rules';
import Navbar from '@/modules/navbar';

const API_URL = 'http://81.26.187.199/api';

function HomePage() {
  const [isLoggedIn] = useState(!!localStorage.getItem('access_token'));

  const sizes = [16, 8, 25, 36];
  const speeds = [1000, 200, 100, 50];
  const speedLabels = ['x1', 'x5', 'x10', 'x20'];

  const [size, setSize] = useState(sizes[0]);
  const [grid, setGrid] = useState<number[][]>([]);

  const [neinghSurvive, setNeinghSurvive] = useState('2/3');
  const [neinghBirth, setNeinghBirth] = useState('3');

  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(0);

  const [isInverting, setIsInverting] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [userSaves, setUserSaves] = useState<any[]>([]);
  const [selectedSaveId, setSelectedSaveId] = useState<number | null>(null);

  // Кастомные уведомления
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Состояние для кастомного подтверждения
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  const engineRef = useRef<GameEngine | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const FIELD_SIZE = 500;

  const api = axios.create({ baseURL: API_URL });
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // Показ обычного уведомления
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Кастомное подтверждение (вместо window.confirm)
  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        message,
        onConfirm: () => {
          setConfirmDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        }
      });
    });
  };

  // Инициализация движка
  useEffect(() => {
    const engine = new GameEngine(size, {
      birth: [Number(neinghBirth)],
      survival: neinghSurvive.split('/').map(Number),
    });
    engineRef.current = engine;
    setGrid(engine.getGrid());
  }, [size, neinghSurvive, neinghBirth]);

  // Обновление популяции
  useEffect(() => {
    const pop = grid.flat().filter(cell => cell > 0).length;
    setPopulation(pop);
  }, [grid]);

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

  // ====================== СИМУЛЯЦИЯ ======================
  useEffect(() => {
    if (!engineRef.current) return;

    if (isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
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

  // ====================== СОХРАНЕНИЕ НА СЕРВЕР ======================
  const handleSaveToServer = async () => {
    if (!engineRef.current) return;
    if (!saveName.trim()) {
      showNotification('error', 'Введите название сохранения');
      return;
    }

    const nameToSave = saveName.trim();

    const existingSave = userSaves.find(save => 
      save.name.toLowerCase() === nameToSave.toLowerCase()
    );

    if (existingSave) {
      const confirmed = await showConfirm(
        `Сохранение с именем "${nameToSave}" уже существует.\n\nХотите перезаписать его?`
      );

      if (!confirmed) return;

      // Перезапись
      const data = {
        ...engineRef.current.toJSON(),
        name: nameToSave,
      };

      try {
        await api.put(`/games/${existingSave.id}/`, data);
        showNotification('success', 'Сохранение успешно перезаписано!');
        setSaveName('');
        loadUserSaves();
      } catch (err: any) {
        showNotification('error', 'Ошибка перезаписи: ' + (err.response?.data?.detail || err.message));
      }
      return;
    }

    // Создание нового сохранения
    const data = {
      ...engineRef.current.toJSON(),
      name: nameToSave,
    };

    try {
      await api.post('/games/', data);
      showNotification('success', 'Игра успешно сохранена на сервере!');
      setSaveName('');
      loadUserSaves();
    } catch (err: any) {
      showNotification('error', 'Ошибка сохранения: ' + (err.response?.data?.detail || err.message));
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
    showNotification('success', 'Файл сохранён на компьютер');
  };

  // ====================== ЗАГРУЗКА И УДАЛЕНИЕ ======================
  const handleLoadGame = (save: any) => {
    if (!engineRef.current) return;
    engineRef.current.loadFromJSON(save);

    setSize(engineRef.current.getSize());
    setGrid(engineRef.current.getGrid());
    setGeneration(engineRef.current.getGeneration());
    setIsRunning(false);

    const loadedRules = engineRef.current.getRules();
    setNeinghSurvive(loadedRules.survival.join('/'));
    setNeinghBirth(loadedRules.birth.join(','));

    setSelectedSaveId(save.id);
    showNotification('success', `Загружена игра: ${save.name}`);
  };

  const handleDeleteSave = async (id: number, name: string) => {
    const confirmed = await showConfirm(`Удалить сохранение "${name}"?`);
    if (!confirmed) return;

    try {
      await api.delete(`/games/${id}/`);
      showNotification('success', 'Сохранение успешно удалено');
      loadUserSaves();
      if (selectedSaveId === id) setSelectedSaveId(null);
    } catch (err: any) {
      showNotification('error', 'Ошибка удаления: ' + (err.response?.data?.detail || err.message));
    }
  };

  // ====================== Остальные обработчики ======================
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

  const handleApplyCustomRules = () => {
    const survStr = (document.getElementById('custom-survival') as HTMLInputElement)?.value || '';
    const birthStr = (document.getElementById('custom-birth') as HTMLInputElement)?.value || '';

    const survival = survStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    const birth = birthStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));

    if (survival.length > 0 && birth.length > 0) {
      engineRef.current?.setRules({ birth, survival });
      setNeinghSurvive(survival.join('/'));
      setNeinghBirth(birth.join(','));
      showNotification('success', 'Правила успешно применены!');
    } else {
      showNotification('error', 'Введите корректные значения для правил');
    }
  };

  const applyShape = (template: string[]) => {
    engineRef.current?.applyShape(template);
    setGrid(engineRef.current!.getGrid());
    setGeneration(0);
    setIsRunning(false);
  };

  const handleMouseDown = (i: number, j: number) => {
    setIsInverting(true);
    engineRef.current?.toggleCell(i, j);
    setGrid(engineRef.current!.getGrid());
  };

  const handleMouseEnter = (i: number, j: number) => {
    if (isInverting) {
      engineRef.current?.toggleCell(i, j);
      setGrid(engineRef.current!.getGrid());
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

      {/* Кастомное уведомление */}
      {notification && (
        <div className={`custom-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Кастомное окно подтверждения */}
      {confirmDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <p>{confirmDialog.message}</p>
            <div className="confirm-buttons">
              <button onClick={confirmDialog.onCancel} className="cancel-btn">
                Отмена
              </button>
              <button onClick={confirmDialog.onConfirm} className="confirm-btn">
                Да, перезаписать
              </button>
            </div>
          </div>
        </div>
      )}

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
            <button onClick={handleRandom}>Случ. заполнение</button>
            <button onClick={handleNext}>След. шаг</button>
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

          {/* Настройки и правила */}
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

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ color: '#a0b0d0', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                Свои правила (выживание / рождение)
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  id="custom-survival"
                  placeholder="2,3"
                  defaultValue={neinghSurvive}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    background: '#112233',
                    color: '#fff',
                    border: '1px solid #334455',
                    borderRadius: '4px'
                  }}
                />
                <input
                  id="custom-birth"
                  placeholder="3"
                  defaultValue={neinghBirth}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    background: '#112233',
                    color: '#fff',
                    border: '1px solid #334455',
                    borderRadius: '4px'
                  }}
                />
                <button
                  onClick={handleApplyCustomRules}
                  style={{
                    padding: '8px 14px',
                    background: '#05a931',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Применить
                </button>
              </div>
              <small style={{ color: '#8899aa' }}>
                Выживание (через запятую), Рождение
              </small>
            </div>
          </div>

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