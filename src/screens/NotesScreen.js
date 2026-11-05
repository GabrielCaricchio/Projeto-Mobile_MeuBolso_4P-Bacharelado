// src/screens/NotesScreen.js
// RF03 – Bloco de Anotações Financeiras (@meubolso_anotacoes)
// RF10 – Filtro e Pesquisa refinada de anotações por palavra-chave ou categoria

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDateShort } from '../utils/formatters';

const TAGS = [
  { id: 'todas', labelPT: 'Todas', labelEN: 'All', icon: 'grid-outline' },
  { id: 'pix', labelPT: 'Chaves Pix', labelEN: 'Pix Keys', icon: 'key-outline' },
  { id: 'economia', labelPT: 'Ideias de Economia', labelEN: 'Saving Ideas', icon: 'bulb-outline' },
  { id: 'lembrete', labelPT: 'Lembretes', labelEN: 'Reminders', icon: 'alarm-outline' },
];

export default function NotesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { notes, addNote, updateNote, deleteNote } = useFinance();
  const { theme } = useTheme();
  const { t, language } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('todas');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  // Campos do formulário
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState('pix');
  const [copiedId, setCopiedId] = useState(null);

  function openCreateModal() {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setSelectedTag('pix');
    setModalVisible(true);
  }

  function openEditModal(note) {
    setEditingNote(note);
    setTitle(note.titulo || note.title || '');
    setContent(note.conteudo || note.content || '');
    setSelectedTag(note.tag || 'geral');
    setModalVisible(true);
  }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert(t('common.attention'), language === 'en' ? 'Please enter a title.' : 'Informe um título para a anotação.');
      return;
    }
    if (!content.trim()) {
      Alert.alert(t('common.attention'), language === 'en' ? 'Please enter content.' : 'Informe o conteúdo da anotação.');
      return;
    }

    if (editingNote) {
      await updateNote(editingNote.id, {
        titulo: title.trim(),
        conteudo: content.trim(),
        tag: selectedTag,
      });
    } else {
      await addNote({
        titulo: title.trim(),
        conteudo: content.trim(),
        tag: selectedTag,
      });
    }

    setModalVisible(false);
  }

  function handleDelete(note) {
    Alert.alert(
      language === 'en' ? 'Delete Note' : 'Excluir Anotação',
      language === 'en'
        ? `Do you really want to delete "${note.titulo}"?`
        : `Deseja realmente excluir "${note.titulo}"?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteNote(note.id),
        },
      ]
    );
  }

  function handleCopy(note) {
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
    Alert.alert(
      language === 'en' ? 'Copied!' : 'Copiado!',
      language === 'en'
        ? 'Content copied successfully to clipboard.'
        : 'Conteúdo copiado com sucesso para a área de transferência!'
    );
  }

  // RF10: Filtro e busca refinada por palavra-chave ou categoria de anotação
  const filteredNotes = useMemo(() => {
    return (notes || []).filter((item) => {
      // Filtro de tag
      if (activeTag !== 'todas' && item.tag !== activeTag) {
        return false;
      }

      // Busca por palavra-chave no título ou conteúdo
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (item.titulo || item.title || '').toLowerCase().includes(q);
        const matchBody = (item.conteudo || item.content || '').toLowerCase().includes(q);
        return matchTitle || matchBody;
      }

      return true;
    });
  }, [notes, activeTag, searchQuery]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Cabeçalho */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.surfaceAlt }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {language === 'en' ? 'Financial Notes' : 'Bloco de Anotações'}
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={openCreateModal}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(30, insets.bottom + 20) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Barra de Pesquisa Refinada (RF10) */}
        <View style={[styles.searchBar, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark }]}>
          <Ionicons name="search-outline" size={18} color={theme.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder={language === 'en' ? 'Search notes, Pix keys, ideas...' : 'Buscar notas, chaves Pix, ideias...'}
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Tags de Categoria de Anotação (RF03 / RF10) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsScroll}
        >
          {TAGS.map((tag) => (
            <TouchableOpacity
              key={tag.id}
              style={[
                styles.tagChip,
                activeTag === tag.id
                  ? [styles.tagChipActive, { backgroundColor: theme.primary, borderColor: theme.primary }]
                  : [styles.tagChipInactive, { backgroundColor: theme.surface, borderColor: theme.borderDark }],
              ]}
              onPress={() => setActiveTag(tag.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tag.icon}
                size={14}
                color={activeTag === tag.id ? '#FFFFFF' : theme.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tagText,
                  { color: activeTag === tag.id ? '#FFFFFF' : theme.textPrimary },
                ]}
              >
                {language === 'en' ? tag.labelEN : tag.labelPT}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lista de Notas / Lembretes */}
        {filteredNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceAlt }]}>
              <Ionicons name="document-text-outline" size={36} color={theme.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {language === 'en' ? 'No notes registered' : 'Nenhuma anotação cadastrada'}
            </Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              {language === 'en'
                ? 'Save Pix keys for billing, saving tips, and quick financial ideas.'
                : 'Salve chaves Pix de cobrança, ideias para poupar e lembretes financeiros rápidos.'}
            </Text>
            <TouchableOpacity
              style={[styles.createFirstBtn, { backgroundColor: theme.primary }]}
              onPress={openCreateModal}
              activeOpacity={0.85}
            >
              <Text style={styles.createFirstBtnText}>
                {language === 'en' ? '+ New Note' : '+ Nova Anotação'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredNotes.map((note) => {
            const isPix = note.tag === 'pix';
            return (
              <View
                key={note.id}
                style={[styles.noteCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={styles.noteTopRow}>
                  <View style={styles.noteTagBadge}>
                    <Ionicons
                      name={isPix ? 'key' : note.tag === 'economia' ? 'bulb' : 'bookmark'}
                      size={12}
                      color={theme.primary}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.noteTagText, { color: theme.primary }]}>
                      {note.tag ? note.tag.toUpperCase() : 'GERAL'}
                    </Text>
                  </View>
                  <Text style={[styles.noteDate, { color: theme.textMuted }]}>
                    {formatDateShort(note.dataCriacao || note.createdAt, language)}
                  </Text>
                </View>

                <Text style={[styles.noteTitle, { color: theme.textPrimary }]}>
                  {note.titulo || note.title}
                </Text>

                <Text style={[styles.noteContent, { color: theme.textSecondary }]}>
                  {note.conteudo || note.content}
                </Text>

                {/* Barra de Ações da Nota */}
                <View style={[styles.noteFooter, { borderTopColor: theme.border }]}>
                  {isPix ? (
                    <TouchableOpacity
                      style={[styles.copyBtn, { backgroundColor: theme.primaryLight }]}
                      onPress={() => handleCopy(note)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={copiedId === note.id ? 'checkmark' : 'copy-outline'}
                        size={14}
                        color={theme.textPurple}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.copyBtnText, { color: theme.textPurple }]}>
                        {copiedId === note.id
                          ? (language === 'en' ? 'Copied' : 'Copiado')
                          : (language === 'en' ? 'Copy Key' : 'Copiar Chave Pix')}
                      </Text>
                    </TouchableOpacity>
                  ) : <View />}

                  <View style={styles.noteActionIcons}>
                    <TouchableOpacity
                      style={styles.iconAction}
                      onPress={() => openEditModal(note)}
                    >
                      <Ionicons name="create-outline" size={18} color={theme.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconAction}
                      onPress={() => handleDelete(note)}
                    >
                      <Ionicons name="trash-outline" size={18} color={theme.expense} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal de Criação / Edição de Anotação (Tabela 2 do PDF) */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitleText, { color: theme.textPrimary }]}>
                {editingNote
                  ? (language === 'en' ? 'Edit Note' : 'Editar Anotação')
                  : (language === 'en' ? 'New Financial Note' : 'Nova Anotação Financeira')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Seletor de Tipo de Nota */}
            <View style={styles.tagSelectorRow}>
              {TAGS.filter((t) => t.id !== 'todas').map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.tagSelectorBtn,
                    selectedTag === t.id && [styles.tagSelectorBtnActive, { backgroundColor: theme.primary }],
                  ]}
                  onPress={() => setSelectedTag(t.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tagSelectorBtnText,
                      { color: selectedTag === t.id ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {language === 'en' ? t.labelEN : t.labelPT}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Campo Título (Tabela 2: titulo) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                {language === 'en' ? 'Title' : 'Título da Anotação'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark, color: theme.textPrimary }]}
                placeholder={language === 'en' ? 'e.g., Billing Pix Key, Supermarket Tip...' : 'Ex: Pix para Cobrança, Dica de Compra...'}
                placeholderTextColor={theme.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Campo Conteúdo (Tabela 2: conteudo) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                {language === 'en' ? 'Content' : 'Conteúdo do Lembrete'}
              </Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderDark, color: theme.textPrimary }]}
                placeholder={language === 'en' ? 'Type the Pix key or financial reminder here...' : 'Digite a chave Pix, lembrete ou dica econômica aqui...'}
                placeholderTextColor={theme.textMuted}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Botão Salvar */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.primary }]}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  tagsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  tagChipActive: {},
  tagChipInactive: {},
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  createFirstBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  createFirstBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noteCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  noteTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteTagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  noteDate: {
    fontSize: 11,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  noteContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  noteActionIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconAction: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 24,
    padding: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '700',
  },
  tagSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tagSelectorBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tagSelectorBtnActive: {},
  tagSelectorBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  textArea: {
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  saveBtn: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
