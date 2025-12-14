import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings, Save } from 'lucide-react';
import { toast } from 'sonner';

// Get ball ordinals based on balls per over
function getBallOrdinals(ballsPerOver) {
  const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
  const count = Math.min(ballsPerOver || 6, 8);
  const result = ordinals.slice(0, count - 1);
  result.push(`${count}th_plus`);
  return result;
}

export default function MatchSettingsDialog({ open, onClose, settings, profileName, onSave }) {
  const [currentSettings, setCurrentSettings] = useState({ ...settings });

  useEffect(() => {
    if (open) {
      setCurrentSettings({ ...settings });
    }
  }, [open, settings]);

  const updateSetting = (key, value) => {
    setCurrentSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(currentSettings, profileName);
    onClose();
  };

  const ballsPerOver = currentSettings.balls_per_over || 6;
  const ballOrdinals = useMemo(() => getBallOrdinals(ballsPerOver), [ballsPerOver]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md max-h-[85vh] overflow-y-auto [&>button]:text-white [&>button]:hover:bg-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Edit Game Rules
          </DialogTitle>
          <p className="text-emerald-400 text-sm">📋 {profileName}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Match Info */}
          <div className="bg-slate-800 rounded-lg p-3">
            <h4 className="text-slate-300 font-medium text-sm mb-3">Match Settings</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-400 text-xs">Total Overs</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={currentSettings.total_overs ?? ''}
                  onChange={(e) => updateSetting('total_overs', e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="bg-slate-700 border-slate-600 text-white h-9"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs">Balls per Over</Label>
                <Input
                  type="number"
                  min={4}
                  max={8}
                  value={currentSettings.balls_per_over ?? ''}
                  onChange={(e) => updateSetting('balls_per_over', e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="bg-slate-700 border-slate-600 text-white h-9"
                />
              </div>
            </div>
          </div>

          {/* Wides Settings */}
          <div className="bg-slate-800 rounded-lg p-3">
            <h4 className="text-amber-400 font-medium text-sm mb-2">Wide Ball Rules ({ballsPerOver} balls/over)</h4>
            <div className="space-y-2">
              {ballOrdinals.map((ord) => (
                <div key={ord} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 w-12">{ord.replace('_plus', '+').replace('th', '')}</span>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={currentSettings[`wide_${ord}_runs`] || 1}
                    onChange={(e) => updateSetting(`wide_${ord}_runs`, parseInt(e.target.value) || 1)}
                    className="bg-slate-700 border-slate-600 text-white h-8 w-14"
                  />
                  <span className="text-slate-500 text-xs">runs</span>
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-slate-500 text-xs">Legal?</span>
                    <Switch
                      checked={currentSettings[`wide_${ord}_legal`] || false}
                      onCheckedChange={(v) => updateSetting(`wide_${ord}_legal`, v)}
                      className="scale-75"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* No Ball Settings */}
          <div className="bg-slate-800 rounded-lg p-3">
            <h4 className="text-orange-400 font-medium text-sm mb-2">No Ball Rules ({ballsPerOver} balls/over)</h4>
            <div className="space-y-2">
              {ballOrdinals.map((ord) => (
                <div key={ord} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 w-12">{ord.replace('_plus', '+').replace('th', '')}</span>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={currentSettings[`noball_${ord}_runs`] || 1}
                    onChange={(e) => updateSetting(`noball_${ord}_runs`, parseInt(e.target.value) || 1)}
                    className="bg-slate-700 border-slate-600 text-white h-8 w-14"
                  />
                  <span className="text-slate-500 text-xs">runs</span>
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-slate-500 text-xs">Legal?</span>
                    <Switch
                      checked={currentSettings[`noball_${ord}_legal`] || false}
                      onCheckedChange={(v) => updateSetting(`noball_${ord}_legal`, v)}
                      className="scale-75"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Other Rules */}
          <div className="bg-slate-800 rounded-lg p-3 space-y-3">
            <h4 className="text-blue-400 font-medium text-sm">Other Rules</h4>
            <div className="flex items-center justify-between">
              <Label className="text-slate-300 text-sm">Free hit on no ball</Label>
              <Switch
                checked={currentSettings.free_hit_on_noball ?? true}
                onCheckedChange={(v) => updateSetting('free_hit_on_noball', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-slate-300 text-sm">Free hit on wide</Label>
              <Switch
                checked={currentSettings.free_hit_on_wide ?? false}
                onCheckedChange={(v) => updateSetting('free_hit_on_wide', v)}
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Retire at score (0 = no limit)</Label>
              <Input
                type="number"
                min={0}
                value={currentSettings.retire_at_score || 0}
                onChange={(e) => updateSetting('retire_at_score', parseInt(e.target.value) || 0)}
                className="bg-slate-700 border-slate-600 text-white h-8 mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-400 text-xs">Powerplay Overs</Label>
                <Input
                  type="number"
                  min={0}
                  value={currentSettings.powerplay_overs || 0}
                  onChange={(e) => updateSetting('powerplay_overs', parseInt(e.target.value) || 0)}
                  className="bg-slate-700 border-slate-600 text-white h-8"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs">Max Overs/Bowler</Label>
                <Input
                  type="number"
                  min={0}
                  value={currentSettings.max_overs_per_bowler || 0}
                  onChange={(e) => updateSetting('max_overs_per_bowler', parseInt(e.target.value) || 0)}
                  className="bg-slate-700 border-slate-600 text-white h-8"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Save className="w-4 h-4 mr-2" /> Apply Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}