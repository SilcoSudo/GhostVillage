import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import WikiDetailModal from './components/WikiDetailModal';
import WikiCreationModal from './components/WikiCreationModal';
import WikiEditorModal from './components/WikiEditorModal';
import WikiDeleteModal from './components/WikiDeleteModal';
import './assets/styles/Wiki.css';

const WikiPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('monsters');

  // Mock data for Monsters
  const [monsters, setMonsters] = useState([
    {
      id: 1,
      name: 'Specter',
      description: 'A ghostly apparition that haunts the dark corners of the map. Weak to light magic but immune to physical attacks.',
      type: 'monster'
    },
    {
      id: 2,
      name: 'Phantom Knight',
      description: 'An armored undead warrior from ancient times. Deals heavy melee damage. Can be defeated by holy water or sacred artifacts.',
      type: 'monster'
    },
    {
      id: 3,
      name: 'Wraith',
      description: 'A malevolent spirit that feeds on fear. Often found in abandoned buildings. Susceptible to purification spells.',
      type: 'monster'
    }
  ]);

  // Mock data for Items
  const [items, setItems] = useState([
    {
      id: 101,
      name: 'Holy Water',
      description: 'A blessed liquid that damages undead creatures. Essential for ghost hunting. Can be crafted or found in churches.',
      type: 'item'
    },
    {
      id: 102,
      name: 'Ghost Trap',
      description: 'A magical device used to capture and contain spirits. Requires activation ritual. Single use item.',
      type: 'item'
    },
    {
      id: 103,
      name: 'Spectral Lens',
      description: 'Allows the user to see invisible ghosts and spirits. Stackable item that increases ghost visibility range.',
      type: 'item'
    }
  ]);

  // Mock data for Maps
  const [maps, setMaps] = useState([
    {
      id: 201,
      name: 'Abandoned Manor',
      description: 'A decaying Victorian mansion filled with powerful spirits. Multiple floors with hidden secrets. Recommended for experienced players.',
      type: 'map'
    },
    {
      id: 202,
      name: 'Graveyard Grounds',
      description: 'An old cemetery where restless spirits roam. Many graves can be searched for items. Dangerous at night.',
      type: 'map'
    },
    {
      id: 203,
      name: 'Hospital Ward',
      description: 'An abandoned hospital with lingering souls. Contains medical items. Multiple objectives to complete.',
      type: 'map'
    }
  ]);

  // Modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');

  // Get data based on active tab
  const getData = () => {
    switch(activeTab) {
      case 'monsters': return monsters;
      case 'items': return items;
      case 'maps': return maps;
      default: return [];
    }
  };

  // Filter data based on search
  const filteredData = getData().filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Modal handlers
  const openDetailModal = (item) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const openCreationModal = () => {
    setSelectedItem(null);
    setIsCreationModalOpen(true);
  };

  const openEditorModal = (item) => {
    setSelectedItem(item);
    setIsEditorModalOpen(true);
  };

  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  // CRUD Handlers
  const handleCreateWiki = (newItem) => {
    const itemWithId = {
      ...newItem,
      id: Math.random().toString(36).substr(2, 9)
    };

    switch(activeTab) {
      case 'monsters':
        setMonsters([itemWithId, ...monsters]);
        break;
      case 'items':
        setItems([itemWithId, ...items]);
        break;
      case 'maps':
        setMaps([itemWithId, ...maps]);
        break;
      default:
        break;
    }
  };

  const handleUpdateWiki = (updatedItem) => {
    switch(activeTab) {
      case 'monsters':
        setMonsters(monsters.map(m => m.id === updatedItem.id ? updatedItem : m));
        break;
      case 'items':
        setItems(items.map(i => i.id === updatedItem.id ? updatedItem : i));
        break;
      case 'maps':
        setMaps(maps.map(m => m.id === updatedItem.id ? updatedItem : m));
        break;
      default:
        break;
    }
  };

  const handleDeleteWiki = () => {
    switch(activeTab) {
      case 'monsters':
        setMonsters(monsters.filter(m => m.id !== selectedItem.id));
        break;
      case 'items':
        setItems(items.filter(i => i.id !== selectedItem.id));
        break;
      case 'maps':
        setMaps(maps.filter(m => m.id !== selectedItem.id));
        break;
      default:
        break;
    }
  };

  const getTabLabel = () => {
    switch(activeTab) {
      case 'monsters': return t('wiki.monsters') || 'Monsters';
      case 'items': return t('wiki.items') || 'Items';
      case 'maps': return t('wiki.maps') || 'Maps';
      default: return '';
    }
  };

  const getTabType = () => {
    switch(activeTab) {
      case 'monsters': return 'monster';
      case 'items': return 'item';
      case 'maps': return 'map';
      default: return '';
    }
  };

  return (
    <div className="wiki-container">
      {/* Header */}
      <div className="wiki-header">
        <div className="header-title">
          <h1>{t('wiki.title') || 'Game Wiki'}</h1>
          <p className="subtitle">{t('wiki.subtitle') || 'Manage game monsters, items, and maps'}</p>
        </div>
        <button
          className="btn-create-wiki"
          onClick={openCreationModal}
          title={t('wiki.create') || 'Create New'}
        >
          <Plus size={18} />
          <span>{t('wiki.create') || 'Create'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="wiki-tabs">
        <button
          className={`tab-btn ${activeTab === 'monsters' ? 'active' : ''}`}
          onClick={() => setActiveTab('monsters')}
        >
          {t('wiki.monsters') || 'Monsters'}
        </button>
        <button
          className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          {t('wiki.items') || 'Items'}
        </button>
        <button
          className={`tab-btn ${activeTab === 'maps' ? 'active' : ''}`}
          onClick={() => setActiveTab('maps')}
        >
          {t('wiki.maps') || 'Maps'}
        </button>
      </div>

      {/* Search */}
      <div className="wiki-search">
        <input
          type="text"
          placeholder={t('wiki.search') || 'Search...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Table */}
      <div className="wiki-table-wrapper">
        <table className="wiki-table">
          <thead>
            <tr>
              <th>{t('wiki.name') || 'Name'}</th>
              <th>{t('wiki.description') || 'Description'}</th>
              <th>{t('common.actions') || 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => (
              <tr key={item.id}>
                <td className="wiki-name-cell">
                  <span className="wiki-name">{item.name}</span>
                </td>
                <td className="wiki-description-cell">
                  <span className="wiki-description">{item.description}</span>
                </td>
                <td className="wiki-actions-cell">
                  <button
                    className="action-btn detail-btn"
                    onClick={() => openDetailModal(item)}
                    title={t('common.view') || 'View'}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="action-btn edit-btn"
                    onClick={() => openEditorModal(item)}
                    title={t('common.edit') || 'Edit'}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => openDeleteModal(item)}
                    title={t('common.delete') || 'Delete'}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <div className="empty-state">
            <p>{t('common.noData') || 'No data found'}</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <WikiDetailModal
        isOpen={isDetailModalOpen}
        item={selectedItem}
        itemType={getTabType()}
        onClose={() => setIsDetailModalOpen(false)}
      />

      <WikiCreationModal
        isOpen={isCreationModalOpen}
        itemType={getTabType()}
        onClose={() => setIsCreationModalOpen(false)}
        onSubmit={handleCreateWiki}
      />

      <WikiEditorModal
        isOpen={isEditorModalOpen}
        item={selectedItem}
        itemType={getTabType()}
        onClose={() => setIsEditorModalOpen(false)}
        onSubmit={handleUpdateWiki}
      />

      <WikiDeleteModal
        isOpen={isDeleteModalOpen}
        item={selectedItem}
        itemType={getTabType()}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteWiki}
      />
    </div>
  );
};

export default WikiPage;
