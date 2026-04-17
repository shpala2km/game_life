// Rules.tsx
import React from 'react';
import './rules.css'; // опционально, если хотите вынести стили

const Rules: React.FC = () => {
  return (
    <details className="rules-details" style={{ marginTop: '20px', width: '100%' }}>
      <summary className="rules-info" style={{ 
        cursor: 'pointer', 
        fontWeight: 'bold', 
        fontSize: '16px',
        padding: '10px',
        background: '#f0f0f0',
        borderRadius: '6px',
        textAlign: 'center'
      }}>
        Правила игры "Жизнь"
      </summary>
      <div className="rules">
        <p><strong>Классические правила:</strong></p>
        <ul>
          <li>Живая клетка с двумя или тремя живыми соседями — выживает.</li>
          <li>Живая клетка с менее чем двумя соседями — умирает от одиночества.</li>
          <li>Живая клетка с более чем тремя соседями — умирает от перенаселения.</li>
          <li>Мёртвая клетка с тремя живыми соседями — рождается.</li>
        </ul>
        <p><strong>Особенности данной реализации:</strong></p>
        <ul>
          <li>Можно менять число соседей, необходимых для выживания клетки</li>
          <li>Живые клетки имеют возраст (стареют каждый шаг).</li>
          <li>Новорождённые клетки — <span style={{color: '#d3ad05'}}>желтые</span>.</li>
          <li>Умирающие клетки — <span style={{color: '#b70404'}}>красные</span>.</li>
          <li>Стабильные живые клетки — <span style={{color: '#05a931'}}>зеленые</span>.</li>
          <li>Симуляция автоматически останавливается при:</li>
          <ul>
            <li>полном вымирании,</li>
            <li>статичных фигурах,</li>
            <li>осцилляторах (повторяющихся фигурах)</li>
          </ul>
        </ul>
      </div>
    </details>
  );
};

export default Rules;