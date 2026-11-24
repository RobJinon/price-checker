import { CheckCircle2, MapPin, Plus, Store, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VendorCategorySelect } from '@/components/vendor-category-select';
import { Vendor, VENDOR_CATEGORIES, VendorCategory } from '@/data/mock-vendors';

type VendorInputProps = {
  vendors: Vendor[];
  vendorName: string;
  onChangeVendorName: (name: string) => void;
  vendorCategory: VendorCategory;
  onChangeVendorCategory: (category: VendorCategory) => void;
  vendorLocation: string;
  onChangeVendorLocation: (location: string) => void;
  labelId?: string;
};

export function VendorInput({
  vendors,
  vendorName,
  onChangeVendorName,
  vendorCategory,
  onChangeVendorCategory,
  vendorLocation,
  onChangeVendorLocation,
  labelId = 'vendor-input',
}: VendorInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const trimmed = vendorName.trim();

  const matchedVendor = useMemo(
    () => vendors.find((v) => v.name.toLowerCase() === trimmed.toLowerCase()),
    [vendors, trimmed]
  );

  const filteredVendors = useMemo(() => {
    if (!trimmed) return vendors;
    const query = trimmed.toLowerCase();
    return vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.location.toLowerCase().includes(query)
    );
  }, [vendors, trimmed]);

  const isNewVendor = Boolean(trimmed) && !matchedVendor;
  const showDropdown = isFocused && Boolean(trimmed) && !matchedVendor && filteredVendors.length > 0;

  const getCategoryLabel = (catValue: VendorCategory) =>
    VENDOR_CATEGORIES.find((c) => c.value === catValue)?.label ?? catValue;

  return (
    <View className="gap-2">
      {/* Search / Type Input with Clear Button */}
      <View className="relative justify-center">
        <Input
          aria-labelledby={labelId}
          placeholder="Search or enter shop name..."
          value={vendorName}
          onChangeText={onChangeVendorName}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Slight delay so tapping a suggestion registers before closing
            setTimeout(() => setIsFocused(false), 150);
          }}
          className={vendorName ? 'pr-9' : undefined}
        />
        {vendorName.length > 0 && (
          <Pressable
            onPress={() => onChangeVendorName('')}
            hitSlop={8}
            className="absolute right-2.5 h-6 w-6 items-center justify-center rounded-full bg-muted/80"
          >
            <X size={13} color="#9ca3af" />
          </Pressable>
        )}
      </View>

      {/* Filtered Dropdown Matches While Typing */}
      {showDropdown && (
        <View className="rounded-lg border border-border bg-card p-1 shadow-sm">
          {filteredVendors.slice(0, 5).map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                onChangeVendorName(item.name);
                setIsFocused(false);
              }}
              className="flex-row items-center justify-between rounded-md px-2.5 py-2 active:bg-secondary"
            >
              <View className="flex-1 flex-row items-center gap-2 pr-2">
                <Store size={14} color="#9ca3af" />
                <View className="flex-1">
                  <Text numberOfLines={1} className="text-sm font-medium text-foreground">
                    {item.name}
                  </Text>
                  {Boolean(item.location) && (
                    <Text numberOfLines={1} className="text-xs text-muted-foreground">
                      {item.location}
                    </Text>
                  )}
                </View>
              </View>
              <View className="rounded bg-secondary px-1.5 py-0.5">
                <Text className="text-[11px] text-secondary-foreground">
                  {getCategoryLabel(item.category)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Quick-Pick Chips When Empty */}
      {!trimmed && vendors.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row gap-1.5">
            {vendors.map((existingVendor) => (
              <Pressable
                key={existingVendor.id}
                onPress={() => onChangeVendorName(existingVendor.name)}
                className="rounded-full border border-border bg-secondary px-2.5 py-1 active:bg-primary"
              >
                <Text className="text-xs text-secondary-foreground">
                  {existingVendor.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Existing Store Confirmation Badge */}
      {matchedVendor && (
        <View className="flex-row items-center justify-between rounded-md border border-border/70 bg-secondary/40 px-2.5 py-1.5">
          <View className="flex-1 flex-row items-center gap-1.5 pr-2">
            <CheckCircle2 size={14} color="#22c55e" />
            <Text numberOfLines={1} className="text-xs text-muted-foreground">
              {getCategoryLabel(matchedVendor.category)}
              {matchedVendor.location ? ` • ${matchedVendor.location}` : ''}
            </Text>
          </View>
        </View>
      )}

      {/* New Store Details Card */}
      {isNewVendor && (
        <View className="gap-2 rounded-lg border border-border bg-secondary/40 p-2.5">
          <View className="flex-row items-center gap-1.5 mb-2">
            <Plus size={13} color="#22c55e" />
            <Text className="text-xs font-semibold text-foreground">
              New shop "{trimmed}"
            </Text>
          </View>

          <Text className='text-sm text-muted-foreground'> Vendor Category</Text>

          <VendorCategorySelect
            value={vendorCategory}
            onChange={onChangeVendorCategory}
          />

          <View className="relative justify-center">
            <Input
              placeholder="Location (e.g. Jaro Public Market, Iloilo City)"
              value={vendorLocation}
              onChangeText={onChangeVendorLocation}
              className="pl-8"
            />
            <View className="pointer-events-none absolute left-2.5">
              <MapPin size={14} color="#9ca3af" />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}