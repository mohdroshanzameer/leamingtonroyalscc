import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Crown, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function TeamCard({ team, playerCount, isSelected, onClick, onEdit, onDelete, onView }) {
  return (
    <Card 
      onClick={onClick}
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-teal-500 bg-teal-50' : 'hover:bg-slate-50'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Logo */}
          {team.logo_url ? (
            <img 
              src={team.logo_url} 
              alt={team.name} 
              className="w-14 h-14 rounded-xl object-cover border-2 border-slate-100"
            />
          ) : (
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: team.primary_color || '#6366f1' }}
            >
              {team.short_name?.substring(0, 2) || team.name?.substring(0, 2)}
            </div>
          )}
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800 truncate">{team.name}</h3>
              {team.is_home_team && (
                <Badge className="bg-green-100 text-green-700 text-xs">Home</Badge>
              )}
            </div>
            {team.short_name && (
              <p className="text-sm text-slate-500">{team.short_name}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {playerCount} players
              </span>
              {team.home_ground && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3" /> {team.home_ground}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView?.(team); }}>
                <Eye className="w-4 h-4 mr-2" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(team); }}>
                <Edit className="w-4 h-4 mr-2" /> Edit Team
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete?.(team); }}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status Badge */}
        {team.status && team.status !== 'Active' && (
          <Badge className={`mt-2 ${team.status === 'Inactive' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
            {team.status}
          </Badge>
        )}
      </div>
    </Card>
  );
}