import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { submissionService } from '@services/submissionService';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface MediaItem {
    uri: string;
    type: 'photo' | 'video';
    mimeType: string;
}

interface MediaUploaderProps {
    taskId: number;
    onSuccess: () => void;
    // ✅ Уже загруженных медиа нет — загрузчик только для новых файлов
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
    taskId,
    onSuccess,
}) => {
    const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Запрос разрешений
    const requestGalleryPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Нет доступа', 'Разреши доступ к галерее в настройках');
            return false;
        }
        return true;
    };

    const requestCameraPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Нет доступа', 'Разреши доступ к камере');
            return false;
        }
        return true;
    };

    // ✅ Выбор из галереи — можно выбрать несколько
    const pickFromGallery = async () => {
        const hasPermission = await requestGalleryPermission();
        if (!hasPermission) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: true,   // ✅ Множественный выбор
            quality: 0.8,
            videoMaxDuration: 60,
        });

        if (!result.canceled && result.assets.length > 0) {
            const newItems: MediaItem[] = result.assets.map((asset) => ({
                uri: asset.uri,
                type: asset.type === 'video' ? 'video' : 'photo',
                mimeType: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
            }));

            // ✅ Добавляем к уже выбранным (не заменяем)
            setSelectedMedia((prev) => [...prev, ...newItems]);
        }
    };

    // ✅ Съёмка через камеру
    const takePhoto = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const newItem: MediaItem = {
                uri: asset.uri,
                type: asset.type === 'video' ? 'video' : 'photo',
                mimeType: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
            };
            setSelectedMedia((prev) => [...prev, newItem]);
        }
    };

    // ✅ Удалить из выбранных (до загрузки)
    const removeSelected = (index: number) => {
        setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
    };

    // ✅ Загрузить все выбранные файлы по одному
    const handleUploadAll = async () => {
        if (selectedMedia.length === 0) return;

        try {
            setIsUploading(true);

            for (let i = 0; i < selectedMedia.length; i++) {
                setUploadingIndex(i);
                const item = selectedMedia[i];
                await submissionService.upload(taskId, item.uri, item.mimeType);
            }

            setSelectedMedia([]);
            setUploadingIndex(null);
            Alert.alert(
                '🎉 Загружено!',
                `${selectedMedia.length > 1
                    ? `${selectedMedia.length} файлов загружено!`
                    : 'Твоё доказательство отправлено!'
                }`
            );
            onSuccess();
        } catch (e: any) {
            Alert.alert('Ошибка', e.message);
        } finally {
            setIsUploading(false);
            setUploadingIndex(null);
        }
    };

    return (
        <View style={styles.container}>

            {/* ✅ Горизонтальный скролл выбранных медиа */}
            {selectedMedia.length > 0 && (
                <View style={styles.previewSection}>
                    <Text style={styles.previewLabel}>
                        Выбрано: {selectedMedia.length} файл(ов)
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.previewScroll}
                    >
                        {selectedMedia.map((item, index) => (
                            <View key={index} style={styles.previewItem}>
                                {item.type === 'photo' ? (
                                    <Image
                                        source={{ uri: item.uri }}
                                        style={styles.previewImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.previewVideo}>
                                        <Ionicons name="play-circle" size={36} color={Colors.white} />
                                        <Text style={styles.previewVideoTxt}>Видео</Text>
                                    </View>
                                )}

                                {/* Бейдж типа */}
                                <View style={styles.typeBadge}>
                                    <Text style={styles.typeBadgeTxt}>
                                        {item.type === 'video' ? '🎥' : '📷'}
                                    </Text>
                                </View>

                                {/* Статус загрузки */}
                                {isUploading && uploadingIndex === index && (
                                    <View style={styles.uploadingOverlay}>
                                        <ActivityIndicator size="small" color={Colors.white} />
                                    </View>
                                )}

                                {/* Кнопка удалить */}
                                {!isUploading && (
                                    <TouchableOpacity
                                        style={styles.removeBtn}
                                        onPress={() => removeSelected(index)}
                                    >
                                        <Ionicons name="close-circle" size={22} color={Colors.error} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}

                        {/* ✅ Кнопка добавить ещё */}
                        {!isUploading && (
                            <TouchableOpacity
                                style={styles.addMoreBtn}
                                onPress={pickFromGallery}
                            >
                                <Ionicons name="add" size={28} color={Colors.primary} />
                                <Text style={styles.addMoreTxt}>Ещё</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>
            )}

            {/* Кнопки выбора — показываем если ничего не выбрано */}
            {selectedMedia.length === 0 && (
                <View style={styles.pickersRow}>
                    <TouchableOpacity style={styles.pickerBtn} onPress={takePhoto}>
                        <Ionicons name="camera" size={28} color={Colors.primary} />
                        <Text style={styles.pickerLabel}>Камера</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.pickerBtn} onPress={pickFromGallery}>
                        <Ionicons name="images" size={28} color={Colors.accent} />
                        <Text style={styles.pickerLabel}>Галерея</Text>
                        <Text style={styles.pickerSub}>Можно несколько</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ✅ Кнопка загрузить все */}
            {selectedMedia.length > 0 && (
                <TouchableOpacity
                    style={[styles.uploadBtn, isUploading && styles.uploadBtnDisabled]}
                    onPress={handleUploadAll}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <View style={styles.uploadingRow}>
                            <ActivityIndicator color={Colors.white} size="small" />
                            <Text style={styles.uploadBtnText}>
                                Загружается {(uploadingIndex ?? 0) + 1} из {selectedMedia.length}...
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.uploadingRow}>
                            <Ionicons name="cloud-upload" size={20} color={Colors.white} />
                            <Text style={styles.uploadBtnText}>
                                {selectedMedia.length > 1
                                    ? `Загрузить ${selectedMedia.length} файла`
                                    : 'Отправить как доказательство'
                                }
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%' },

    // Превью выбранных
    previewSection: { marginBottom: 12 },
    previewLabel: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 8,
        fontWeight: '500',
    },
    previewScroll: {
        gap: 10,
        paddingRight: 10,
    },
    previewItem: {
        width: 110,
        height: 110,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    previewVideo: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.card,
        gap: 4,
    },
    previewVideoTxt: {
        color: Colors.white,
        fontSize: 11,
        fontWeight: '600',
    },
    typeBadge: {
        position: 'absolute',
        top: 6,
        left: 6,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 6,
        padding: 3,
    },
    typeBadgeTxt: { fontSize: 12 },

    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
    },

    // Кнопка добавить ещё
    addMoreBtn: {
        width: 110,
        height: 110,
        borderRadius: 12,
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: Colors.primary + '60',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    addMoreTxt: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '600',
    },

    // Кнопки выбора
    pickersRow: {
        flexDirection: 'row',
        gap: 12,
    },
    pickerBtn: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 14,
        paddingVertical: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        gap: 6,
    },
    pickerLabel: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
    pickerSub: {
        color: Colors.textMuted,
        fontSize: 10,
    },

    // Кнопка загрузить
    uploadBtn: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    uploadBtnDisabled: { opacity: 0.6 },
    uploadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    uploadBtnText: {
        color: Colors.white,
        fontWeight: '700',
        fontSize: 15,
    },
});