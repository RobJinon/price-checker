import { ChevronDown, Check } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { PRODUCT_UNIT_SECTIONS, PRODUCT_UNITS } from '@/constants/product-units';

type UnitSelectProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};

export function UnitSelect({
    value,
    onChange,
    placeholder = 'Select unit',
}: UnitSelectProps) {
    const [open, setOpen] = useState(false);

    const selectedOption = PRODUCT_UNITS.find((u) => u.value === value);

    return (
        <>
            <Pressable
                onPress={() => setOpen(true)}
                className="h-10 flex-row items-center justify-between rounded-md border border-input bg-background px-3"
            >
                {selectedOption ? (
                    <View className="flex-1 flex-row items-center gap-2 pr-2">
                        <View className="min-w-[36px] items-center justify-center rounded bg-muted px-1.5 py-0.5">
                            <Text className="font-mono text-xs font-medium text-muted-foreground">
                                {selectedOption.value}
                            </Text>
                        </View>
                        <Text numberOfLines={1} className="flex-1 text-sm text-foreground">
                            {selectedOption.label}
                        </Text>
                    </View>
                ) : (
                    <Text numberOfLines={1} className="flex-1 pr-2 text-sm text-muted-foreground">
                        {placeholder}
                    </Text>
                )}
                <ChevronDown size={16} color="#9ca3af" />
            </Pressable>

            <Modal
                visible={open}
                transparent
                animationType="fade"
                onRequestClose={() => setOpen(false)}
            >
                <Pressable
                    className="flex-1 items-center justify-center bg-black/50 p-6"
                    onPress={() => setOpen(false)}
                >
                    <Pressable
                        onPress={(e) => e.stopPropagation()}
                        className="max-h-96 w-full max-w-sm rounded-lg border border-border bg-background p-2 shadow-lg"
                    >
                        <View className="border-b border-border px-3 py-2.5">
                            <Text className="text-sm font-semibold text-foreground">
                                Select Unit
                            </Text>
                        </View>

                        <View className="flex-row items-center gap-2.5 border-b border-border/60 px-2 py-1.5">
                            <View className="min-w-[52px] items-center">
                                <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Unit
                                </Text>
                            </View>
                            <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Label
                            </Text>
                        </View>

                        <ScrollView keyboardShouldPersistTaps="handled" className="pt-1">
                            <Pressable
                                onPress={() => {
                                    onChange('');
                                    setOpen(false);
                                }}
                                className="flex-row items-center justify-between rounded-md px-2 py-2 active:bg-secondary"
                            >
                                <View className="flex-row items-center gap-2.5">
                                    <View className="min-w-[52px] items-center justify-center rounded bg-muted/40 px-1.5 py-0.5">
                                        <Text className="font-mono text-xs text-muted-foreground">
                                            —
                                        </Text>
                                    </View>
                                    <Text className="text-sm text-muted-foreground">None</Text>
                                </View>
                                {value === '' && <Check size={16} color="#22c55e" />}
                            </Pressable>

                            {PRODUCT_UNIT_SECTIONS.map((section) => (
                                <View key={section.title} className="mt-3">
                                    <View className="border-t border-border/60 px-2 pb-1 pt-2.5">
                                        <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            {section.title}
                                        </Text>
                                    </View>

                                    {section.data.map((unit) => {
                                        const isSelected = value === unit.value;
                                        return (
                                            <Pressable
                                                key={unit.value}
                                                onPress={() => {
                                                    onChange(unit.value);
                                                    setOpen(false);
                                                }}
                                                className={`flex-row items-center justify-between rounded-md px-2 py-2 ${
                                                    isSelected ? 'bg-secondary' : 'active:bg-secondary/60'
                                                }`}
                                            >
                                                <View className="flex-row items-center gap-2.5">
                                                    <View
                                                        className={`min-w-[52px] items-center justify-center rounded py-0.5 ${
                                                            isSelected ? 'bg-background' : 'bg-muted/70'
                                                        }`}
                                                    >
                                                        <Text className="font-mono text-xs font-medium text-muted-foreground">
                                                            {unit.value}
                                                        </Text>
                                                    </View>
                                                    <Text
                                                        className={`text-sm ${
                                                            isSelected
                                                                ? 'font-semibold text-foreground'
                                                                : 'text-foreground'
                                                        }`}
                                                    >
                                                        {unit.label}
                                                    </Text>
                                                </View>
                                                {isSelected && <Check size={16} color="#22c55e" />}
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            ))}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}