import { Colors } from '@constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { submissionService } from '@services/submissionService';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface MediaUploaderProps {
    taskId: number;
    onSuccess: () => void;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
    taskId,
    onSuccess,
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'photo' | 'video' | null>(null);

    // Запрос разрешения на камеру/галерею
    const requestPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Нет доступа',
                'Разреши доступ к галерее в настройках телефона'
            );
            return false;
        }
        return true;
    };

    const pickFromGallery = async () => {
        const hasPermission = await requestPermission();
        if (!hasPermission) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            quality: 0.8,
            videoMaxDuration: 60, // Максимум 60 секунд
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setPreview(asset.uri);
            setMediaType(asset.type === 'video' ? 'video' : 'photo');
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Нет доступа', 'Разреши доступ к камере');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setPreview(asset.uri);
            setMediaType(asset.type === 'video' ? 'video' : 'photo');
        }
    };

    const handleUpload = async () => {
        if (!preview || !mediaType) return;

        try {
            setIsUploading(true);

            const mimeType = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
            await submissionService.upload(taskId, preview, mimeType);

            Alert.alert('🎉 Загружено!', 'Твоё доказательство отправлено!');
            setPreview(null);
            setMediaType(null);
            onSuccess();
        } catch (e: any) {
            Alert.alert('Ошибка', e.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Превью */}
            {preview ? (
                <View style={styles.previewWrapper}>
                    <Image source={{ uri: preview }} style={styles.preview} resizeMode="cover" />
                    <View style={styles.mediaTypeBadge}>
                        <Text style={styles.mediaTypeTxt}>
                            {mediaType === 'video' ? '🎥 Видео' : '📷 Фото'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => { setPreview(null); setMediaType(null); }}
                    >
                        <Ionicons name="close-circle" size={28} color={Colors.error} />
                    </TouchableOpacity>
                </View>
            ) : (
                // Кнопки выбора
                <View style={styles.pickersRow}>
                    <TouchableOpacity style={styles.pickerBtn} onPress={takePhoto}>
                        <Ionicons name="camera" size={28} color={Colors.primary} />
                        <Text style={styles.pickerLabel}>Камера</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.pickerBtn} onPress={pickFromGallery}>
                        <Ionicons name="images" size={28} color={Colors.accent} />
                        <Text style={styles.pickerLabel}>Галерея</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Кнопка загрузки */}
            {preview && (
                <TouchableOpacity
                    style={[styles.uploadBtn, isUploading && styles.uploadBtnDisabled]}
                    onPress={handleUpload}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <ActivityIndicator color={Colors.white} size="small" />
                    ) : (
                        <>
                            <Ionicons name="cloud-upload" size={20} color={Colors.white} />
                            <Text style={styles.uploadBtnText}>Отправить как доказательство</Text>
                        </>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%' },

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
        gap: 8,
    },
    pickerLabel: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: '500',
    },

    previewWrapper: {
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: 12,
    },
    preview: {
        width: '100%',
        height: 220,
        borderRadius: 14,
    },
    mediaTypeBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    mediaTypeTxt: { color: Colors.white, fontSize: 12, fontWeight: '600' },
    removeBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
    },

    uploadBtn: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    uploadBtnDisabled: { opacity: 0.6 },
    uploadBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});