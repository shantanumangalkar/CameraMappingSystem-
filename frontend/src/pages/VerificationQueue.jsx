import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { CheckCircle2, XCircle, Clock, Shield, MapPin, Camera, AlertCircle, User, Phone, Compass, QrCode, Eye } from 'lucide-react';

export const VerificationQueue = () => {
  const queryClient = useQueryClient();
  const [rejectModalId, setRejectModalId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [inspectCamera, setInspectCamera] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pending-cameras'],
    queryFn: () => api.get('/cameras/search?verificationStatus=PENDING&size=100'),
    refetchInterval: 3000,
  });

  const approvalMutation = useMutation({
    mutationFn: ({ id, verificationStatus, rejectionReason }) =>
      api.patch(`/cameras/${id}/approval`, { verificationStatus, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-cameras'] });
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      queryClient.invalidateQueries({ queryKey: ['nearby-cameras-all'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setRejectModalId(null);
      setRejectionReason('');
      setInspectCamera(null);
    },
  });

  const handleApprove = (id) => {
    approvalMutation.mutate({ id, verificationStatus: 'APPROVED' });
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectModalId) return;
    approvalMutation.mutate({
      id: rejectModalId,
      verificationStatus: 'REJECTED',
      rejectionReason,
    });
  };

  const pendingCameras = data?.data?.content || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 border-l-4 border-l-amber-500">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Field Survey Verification Queue & Camera Owner Specs
          </h2>
          <p className="text-xs text-slate-400 mt-1">Inspect all camera technical specs and owner credentials submitted by field surveyors before authorizing into live police GIS database.</p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono shrink-0 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          {pendingCameras.length} PENDING VERIFICATION
        </div>
      </div>

      {/* Grid of Pending Camera Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full glass-card p-8 text-center text-slate-400">
            Loading field survey queue...
          </div>
        ) : pendingCameras.length === 0 ? (
          <div className="col-span-full glass-card p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto opacity-80" />
            <h3 className="text-base font-bold text-white">Verification Queue Clear</h3>
            <p className="text-xs text-slate-500">All surveyed CCTV cameras have been reviewed and approved into the police database.</p>
          </div>
        ) : (
          pendingCameras.map((cam) => (
            <div key={cam.id} className="glass-card p-5 space-y-3 flex flex-col justify-between hover:border-amber-500/50 transition-all border-slate-800">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-mono font-bold text-amber-300 text-sm">{cam.cameraCode}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-200 border border-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
                    {cam.cameraType}
                  </span>
                </div>

                <h4 className="font-bold text-white text-base leading-tight">{cam.cameraName}</h4>

                <div className="text-xs text-slate-400 space-y-1">
                  <p className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    {cam.fullAddress || cam.area || 'Zone 1'}
                  </p>
                  <p className="font-mono text-[11px] text-slate-500">
                    Coords: {cam.latitude?.toFixed(5)}, {cam.longitude?.toFixed(5)}
                  </p>
                </div>

                {/* Camera Owner Specs Card */}
                <div className="p-3 rounded-xl bg-police-950/60 border border-police-500/30 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-police-300 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-police-400" />
                      {cam.ownerName || 'Govt / Police Dept'}
                    </span>
                    <span className="text-[9px] bg-police-600/30 text-police-300 border border-police-500/30 px-1.5 py-0.5 rounded uppercase font-mono">
                      {cam.ownerType || 'COMMERCIAL'}
                    </span>
                  </div>

                  {cam.ownerContact && (
                    <p className="text-[11px] text-slate-300 flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Phone: <strong>{cam.ownerContact}</strong>
                    </p>
                  )}
                </div>

                {/* Technical Lens & Surveyor Specs */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[9px]">Lens Angle:</span>
                    <strong className="flex items-center gap-1 text-police-300">
                      <Compass className="w-3 h-3" /> {cam.directionAngle || 0}°
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">Coverage Radius:</span>
                    <strong>{cam.coverageRadiusMeters || 80}m</strong>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-800 text-slate-400">
                    Field Surveyor: <strong className="text-slate-200">{cam.surveyorName || 'Field Team'}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(cam.id)}
                    disabled={approvalMutation.isPending}
                    className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Approve Camera
                  </button>

                  <button
                    onClick={() => setRejectModalId(cam.id)}
                    disabled={approvalMutation.isPending}
                    className="flex-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4 text-rose-400" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">Specify Rejection Reason</h3>
            <form onSubmit={handleRejectSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Reason for Rejection *</label>
                <textarea
                  required
                  rows="3"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Obstructed field of view, inaccurate GPS coordinates, invalid owner phone number"
                  className="glass-input w-full"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRejectModalId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approvalMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-500"
                >
                  Submit Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
